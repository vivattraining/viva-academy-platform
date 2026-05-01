import hashlib
import hmac
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.auth import (
    auth_dependency,
    bootstrap_admin_user,
    create_credential,
    ensure_student_credential,
    list_credentials,
    login_user,
    revoke_session,
    revoke_sessions_for_email,
    tenant_has_credentials,
    update_credential,
)
from app.config import settings
from app.course_catalog import find_course, is_open_for_admissions
from app.db import get_db
from app.integrations import (
    create_payment_link,
    fetch_payment_status,
    provision_zoom_meeting,
    razorpay_mode,
    render_reservation_confirmation_email,
    send_email,
)
from app.schemas import (
    ApplicationAttendanceUpdate,
    ApplicationCreate,
    ApplicationStatusUpdate,
    BatchCreate,
    BootstrapAdminRequest,
    ChapterSubmissionCreate,
    CredentialCreateRequest,
    CredentialUpdateRequest,
    CourseChapterCreate,
    CourseCreate,
    CourseModuleCreate,
    LearnerProgressUpdate,
    LoginRequest,
    PaymentLinkUpdate,
    PaymentVerificationRequest,
    SessionAttendanceUpdate,
    SessionCreate,
    SessionZoomUpdate,
    TenantBranding,
    TrainerReviewCreate,
    ZoomProvisionRequest,
    ZoomWebhookAttendance,
)
from app.store import (
    assign_first_batch_if_needed,
    create_chapter_submission,
    create_application,
    create_batch,
    create_course,
    create_course_chapter,
    create_course_module,
    create_message_event,
    create_session,
    create_trainer_review,
    find_application_by_email,
    find_application_by_order_id,
    find_application_by_reference,
    find_session_by_zoom_meeting_id,
    find_tenant_by_domain,
    get_application,
    get_course_outline,
    get_session,
    get_student_lms_overview,
    get_tenant_state,
    list_applications,
    list_attendance,
    list_batches,
    list_chapter_submissions,
    list_courses,
    list_message_events,
    list_sessions,
    list_trainer_reviews,
    mark_attendance,
    now_iso,
    save_tenant_state,
    update_learner_progress,
    update_application,
    update_branding,
    update_session,
    get_trainer_review_queue,
    was_webhook_event_processed,
    record_webhook_event,
)

router = APIRouter()

READ_ROLES = {"admin", "operations", "trainer"}
WRITE_ROLES = {"admin", "operations"}
TRAINER_ROLES = {"admin", "operations", "trainer"}
VALID_APPLICATION_STAGES = {"applied", "payment_pending", "enrolled", "certificate_issued"}
VALID_PAYMENT_STAGES = {"not_started", "order_created", "verification_pending", "paid", "payment_failed"}
VALID_ENROLLMENT_STAGES = {"prospect", "active", "completed"}


def _apply_payment_state_transition(item: dict, patch: dict) -> dict:
    next_item = {**item, **patch}
    payment_stage = next_item.get("payment_stage", item.get("payment_stage"))
    application_stage = next_item.get("application_stage", item.get("application_stage"))
    enrollment_stage = next_item.get("enrollment_stage", item.get("enrollment_stage"))

    if payment_stage == "paid":
        next_item["application_stage"] = "enrolled"
        next_item["enrollment_stage"] = "active"
    elif payment_stage in {"order_created", "verification_pending", "payment_failed", "not_started"}:
        if application_stage == "enrolled":
            next_item["application_stage"] = "payment_pending"
        if enrollment_stage == "active":
            next_item["enrollment_stage"] = "prospect"

    return next_item


def _validate_application_transition(current: dict, patch: dict) -> None:
    next_application_stage = patch.get("application_stage", current.get("application_stage"))
    next_payment_stage = patch.get("payment_stage", current.get("payment_stage"))
    next_enrollment_stage = patch.get("enrollment_stage", current.get("enrollment_stage"))

    if next_application_stage and next_application_stage not in VALID_APPLICATION_STAGES:
        raise HTTPException(status_code=422, detail="Invalid application stage")
    if next_payment_stage and next_payment_stage not in VALID_PAYMENT_STAGES:
        raise HTTPException(status_code=422, detail="Invalid payment stage")
    if next_enrollment_stage and next_enrollment_stage not in VALID_ENROLLMENT_STAGES:
        raise HTTPException(status_code=422, detail="Invalid enrollment stage")

    if next_application_stage == "enrolled" and next_payment_stage != "paid":
        raise HTTPException(status_code=422, detail="Application cannot be enrolled before payment is marked paid")
    if next_enrollment_stage == "active" and next_payment_stage != "paid":
        raise HTTPException(status_code=422, detail="Enrollment cannot become active before payment is marked paid")
    if next_application_stage == "certificate_issued" and next_enrollment_stage != "completed":
        raise HTTPException(status_code=422, detail="Certificate issuance requires enrollment to be completed")


def _save_payment_transition(db: Session, tenant_name: str, application_id: str, patch: dict) -> Optional[dict]:
    current = get_application(db, tenant_name, application_id)
    if current is None:
        return None
    _validate_application_transition(current, patch)
    next_patch = _apply_payment_state_transition(current, patch)
    next_patch.pop("id", None)
    next_patch.pop("tenant_name", None)
    return update_application(db, tenant_name, application_id, next_patch)


def _reconcile_application_payment(db: Session, application: dict, *, reported_outcome: Optional[str] = None) -> dict:
    tenant_name = application["tenant_name"]
    application_id = application["id"]
    payment_mode = application.get("payment_mode") or razorpay_mode()
    order_id = application.get("payment_order_id")
    checked_at = now_iso()

    patch = {
        "payment_mode": payment_mode,
        "payment_last_checked_at": checked_at,
        "payment_reconciliation_status": "checked",
    }

    if payment_mode != "live":
        if reported_outcome == "success":
            patch.update(
                {
                    "payment_stage": "paid",
                    "payment_gateway_status": "mock_captured",
                    "payment_verified_at": checked_at,
                    "payment_gateway_payment_id": application.get("payment_gateway_payment_id") or f"mockpay_{application_id[-8:]}",
                }
            )
        elif reported_outcome == "failed":
            patch.update(
                {
                    "payment_stage": "payment_failed",
                    "payment_gateway_status": "mock_failed",
                    "payment_failed_at": checked_at,
                }
            )
        else:
            patch.update(
                {
                    "payment_stage": "verification_pending" if order_id else application.get("payment_stage", "not_started"),
                    "payment_gateway_status": "mock_pending",
                }
            )
        return _save_payment_transition(db, tenant_name, application_id, patch) or application

    if not order_id:
        patch.update(
            {
                "payment_reconciliation_status": "missing_order",
                "payment_gateway_status": "not_started",
            }
        )
        return _save_payment_transition(db, tenant_name, application_id, patch) or application

    status = fetch_payment_status(order_id=order_id)
    patch.update(
        {
            "payment_gateway_order_status": status.get("order_status"),
            "payment_gateway_status": status.get("payment_status"),
            "payment_gateway_payment_id": status.get("payment_id"),
        }
    )

    if status.get("captured"):
        patch.update(
            {
                "payment_stage": "paid",
                "payment_verified_at": checked_at,
                "payment_reconciliation_status": "verified",
            }
        )
    elif status.get("payment_status") == "failed" or reported_outcome == "failed":
        patch.update(
            {
                "payment_stage": "payment_failed",
                "payment_failed_at": checked_at,
                "payment_reconciliation_status": "failed",
            }
        )
    else:
        patch.update(
            {
                "payment_stage": "verification_pending",
                "payment_reconciliation_status": "pending",
            }
        )

    return _save_payment_transition(db, tenant_name, application_id, patch) or application


def _resolve_razorpay_application(db: Session, event: dict, reference: Optional[str] = None) -> Optional[dict]:
    if reference:
        application = find_application_by_reference(db, reference)
        if application is not None:
            return application

    payment_entity = (((event.get("payload") or {}).get("payment") or {}).get("entity") or {})
    order_id = payment_entity.get("order_id")
    if isinstance(order_id, str) and order_id:
        application = find_application_by_order_id(db, order_id)
        if application is not None:
            return application

    notes = payment_entity.get("notes")
    if isinstance(notes, dict):
        application_id = notes.get("application_id")
        if isinstance(application_id, str) and application_id:
            application = find_application_by_reference(db, application_id)
            if application is not None:
                return application

    return None


@router.post("/auth/login")
def academy_login(payload: LoginRequest, db: Session = Depends(get_db)):
    return {
        "ok": True,
        "session": login_user(db, payload.tenant_name, payload.email, payload.password, payload.expected_role),
    }


@router.get("/auth/status")
def academy_auth_status(tenant_name: str, db: Session = Depends(get_db)):
    return {
        "ok": True,
        "tenant_name": tenant_name,
        "bootstrap_required": not tenant_has_credentials(db, tenant_name),
    }


@router.post("/auth/bootstrap-admin")
def academy_bootstrap_admin(
    payload: BootstrapAdminRequest,
    x_bootstrap_token: Optional[str] = Header(default=None, alias="X-Bootstrap-Token"),
    db: Session = Depends(get_db),
):
    """Bootstrap the first admin for a tenant.

    Hardened:
      - Requires the X-Bootstrap-Token header to match ACADEMY_BOOTSTRAP_TOKEN.
        Without that env var configured, the endpoint is disabled outright in
        any environment that isn't local development.
      - Constant-time comparison via hmac.compare_digest.
      - bootstrap_admin_user already raises 409 if the tenant already has any
        credential, providing a second layer of protection.
    """
    expected_token = settings.academy_bootstrap_token
    if not expected_token:
        if settings.app_env == "production":
            raise HTTPException(
                status_code=403,
                detail="Bootstrap is disabled. Set ACADEMY_BOOTSTRAP_TOKEN to enable.",
            )
        # Allow open bootstrap in local/dev only when no token is configured.
    else:
        if not x_bootstrap_token or not hmac.compare_digest(
            x_bootstrap_token.encode("utf-8"),
            expected_token.encode("utf-8"),
        ):
            raise HTTPException(status_code=403, detail="Invalid bootstrap token")

    return {
        "ok": True,
        "session": bootstrap_admin_user(
            db,
            payload.tenant_name,
            email=payload.email,
            full_name=payload.full_name,
            password=payload.password,
        ),
    }


@router.post("/auth/users/secure")
def academy_create_user_secure(
    payload: CredentialCreateRequest,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, {"admin"})
    credential = create_credential(
        db,
        payload.tenant_name,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        password=payload.password,
    )
    return {
        "ok": True,
        "item": {
            "email": credential.email,
            "full_name": credential.full_name,
            "role": credential.role,
        },
    }


@router.get("/auth/users/secure")
def academy_list_users_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, {"admin"})
    credentials = list_credentials(db, tenant_name)
    return {
        "ok": True,
        "items": [
            {
                "email": credential.email,
                "full_name": credential.full_name,
                "role": credential.role,
                "created_at": credential.created_at,
            }
            for credential in credentials
        ],
    }


@router.patch("/auth/users/secure")
def academy_update_user_secure(
    payload: CredentialUpdateRequest,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, {"admin"})
    credential = update_credential(
        db,
        payload.tenant_name,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        password=payload.password,
    )
    revoked_sessions = revoke_sessions_for_email(db, payload.tenant_name, payload.email) if payload.password else 0
    return {
        "ok": True,
        "item": {
            "email": credential.email,
            "full_name": credential.full_name,
            "role": credential.role,
            "created_at": credential.created_at,
            "updated_at": credential.updated_at,
            "revoked_sessions": revoked_sessions,
        },
    }


@router.get("/auth/me")
def academy_me(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    return {
        "ok": True,
        "session": auth_dependency(db, tenant_name, x_academy_session, authorization, None),
    }


@router.post("/auth/logout")
def academy_logout(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    session = auth_dependency(db, tenant_name, x_academy_session, authorization, None)
    revoke_session(db, tenant_name, session["session_token"])
    return {
        "ok": True,
        "logged_out": True,
    }


@router.get("/tenants/{tenant_name}")
def get_tenant(tenant_name: str, db: Session = Depends(get_db)):
    state = get_tenant_state(db, tenant_name)
    return {
        "tenant_name": tenant_name,
        "branding": state["branding"],
        "counts": {
            "applications": len(state["applications"]),
            "batches": len(state["batches"]),
            "sessions": len(state["sessions"]),
            "attendance": len(state["attendance"]),
            "courses": len(state.get("courses", [])),
            "modules": len(state.get("course_modules", [])),
            "chapters": len(state.get("course_chapters", [])),
            "submissions": len(state.get("chapter_submissions", [])),
        },
    }


@router.get("/tenants/by-domain/{domain:path}")
def get_tenant_by_domain(domain: str, db: Session = Depends(get_db)):
    state = find_tenant_by_domain(db, domain)
    if state is None:
        raise HTTPException(status_code=404, detail="No tenant matched this domain")
    return {
        "tenant_name": state["tenant_name"],
        "branding": state["branding"],
    }


@router.post("/tenants/branding")
def save_branding(payload: TenantBranding, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/tenants/branding/secure")
def save_branding_secure(
    payload: TenantBranding,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, {"admin"})
    item = update_branding(db, payload.tenant_name, payload.model_dump())
    return {
        "ok": True,
        "item": item,
    }


@router.get("/courses/catalog")
def read_course_catalog(db: Session = Depends(get_db)):
    """
    Public, unauthenticated read of the course catalog.

    This is the SINGLE SOURCE OF TRUTH for ALL course data — name,
    price, cohort, duration, marketing copy, title splits, and
    reservation fee. The homepage cards, the /courses page, and the
    application form all fetch from here so that any change in
    `apps/api/app/course_catalog.py` propagates to every surface
    automatically — there is no second file to keep in sync.

    Returns:
      items: [
        {
          code, name,
          fee_inr, fee_display,
          reservation_fee_inr, reservation_fee_display,
          duration_label, format_label, cohort_label,
          coming_soon,
          title_lead, title_emphasis, description
        },
        ...
      ]
    """
    from app.course_catalog import COURSE_CATALOG
    from app.catalog_audit import detect_and_record

    # Run the catalog change detector. Cheap when nothing changed
    # (single hash compare); when prices or copy were edited, this
    # records change events visible in the /admin catalog history
    # panel. Failures here must NOT break the public endpoint —
    # serving the catalog is more important than recording history.
    try:
        detect_and_record(db)
    except Exception as audit_err:  # noqa: BLE001
        logger.warning("catalog_audit: detect failed err=%s", audit_err)

    items = []
    for course in COURSE_CATALOG:
        # Python's f-string ',' grouping is US-style (24,999) which
        # happens to match Indian style for amounts under 1 lakh.
        # For ≥ 1 lakh we'd want "1,00,000"; not relevant here yet.
        fee_display = f"₹{course.fee_inr:,}*"
        reservation_fee_display = (
            f"₹{course.reservation_fee_inr:,}" if course.reservation_fee_inr else ""
        )
        items.append(
            {
                "code": course.code,
                "name": course.name,
                "fee_inr": course.fee_inr,
                "fee_display": fee_display,
                "reservation_fee_inr": course.reservation_fee_inr,
                "reservation_fee_display": reservation_fee_display,
                "duration_label": course.duration_label,
                "format_label": course.format_label,
                "cohort_label": course.cohort_label,
                "coming_soon": course.coming_soon,
                "title_lead": course.title_lead,
                "title_emphasis": course.title_emphasis,
                "description": course.description,
            }
        )
    return {"items": items}


@router.post("/courses/import/p01/secure")
def import_p01_curriculum(
    tenant_name: str,
    force: bool = False,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    One-shot import of the bundled P·01 Foundation Program curriculum.

    Reads `apps/api/app/data/p01_curriculum.json` (16 weeks, ~65
    chapters from Course.docx) and creates the Course + every Module
    + every Chapter in tenant_state. Admin-only.

    Idempotency:
      - If a course with code "P · 01" already exists, this returns
        409 with instructions.
      - Pass `?force=true` to delete the existing course (plus all
        its modules and chapters) and re-import from the JSON. Use
        with care — this destroys learner progress against the old
        course rows.

    The bundled JSON file is the source of truth for the curriculum.
    Faculty/admin: review the file in git first, edit titles or
    summaries as needed, push, and only then call this endpoint.
    """
    auth_dependency(db, tenant_name, x_academy_session, authorization, {"admin"})

    import json
    from pathlib import Path

    data_path = Path(__file__).resolve().parent.parent / "data" / "p01_curriculum.json"
    if not data_path.exists():
        raise HTTPException(status_code=500, detail=f"Curriculum file missing at {data_path}")

    try:
        payload = json.loads(data_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as parse_err:
        raise HTTPException(status_code=500, detail=f"Curriculum JSON is invalid: {parse_err}")

    course_payload = payload.get("course") or {}
    modules_payload = payload.get("modules") or []
    course_code = course_payload.get("code", "P · 01")

    # Existence check
    state = get_tenant_state(db, tenant_name)
    existing = next(
        (c for c in state.get("courses", []) if c.get("code") == course_code),
        None,
    )
    if existing is not None:
        if not force:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Course {course_code} already exists (id={existing['id']}). "
                    "Pass ?force=true to delete and re-import. WARNING: re-import "
                    "destroys all module/chapter rows for this course; learner "
                    "progress against those rows will be orphaned."
                ),
            )
        # Force-delete path: remove the course + all its modules + chapters
        old_course_id = existing["id"]
        state["course_chapters"] = [
            c for c in state.get("course_chapters", [])
            if c.get("course_id") != old_course_id
        ]
        state["course_modules"] = [
            m for m in state.get("course_modules", [])
            if m.get("course_id") != old_course_id
        ]
        state["courses"] = [
            c for c in state["courses"] if c["id"] != old_course_id
        ]
        from app.store import save_tenant_state
        save_tenant_state(db, tenant_name, state)
        logger.info("p01 import: force-deleted existing course %s prior to reimport", old_course_id)

    # Create the course row
    course_payload_clean = {
        "title": course_payload.get("title", ""),
        "slug": course_payload.get("slug", ""),
        "code": course_code,
        "description": course_payload.get("description", ""),
        "duration_weeks": course_payload.get("duration_weeks", 16),
        "weekly_unlock_days": course_payload.get("weekly_unlock_days", 7),
        "penalty_fee_amount": course_payload.get("penalty_fee_amount", 2000),
        "penalty_fee_currency": course_payload.get("penalty_fee_currency", "INR"),
        "relock_grace_days": course_payload.get("relock_grace_days", 2),
        "certificate_name": course_payload.get("certificate_name"),
        "active": course_payload.get("active", True),
    }
    if not course_payload_clean["title"] or not course_payload_clean["slug"]:
        raise HTTPException(status_code=422, detail="Course title and slug are required in the JSON.")

    created_course = create_course(db, tenant_name, course_payload_clean)

    # Create modules + chapters
    summary: list[dict] = []
    for module_data in modules_payload:
        module_clean = {
            "course_id": created_course["id"],
            "title": module_data.get("title", ""),
            "week_number": module_data.get("week_number", 1),
            "summary": module_data.get("summary", ""),
            "submission_required": module_data.get("submission_required", True),
            "passing_score": module_data.get("passing_score", 70),
        }
        if not module_clean["title"]:
            logger.warning("p01 import: skipping module with empty title (week=%s)", module_clean["week_number"])
            continue
        created_module = create_course_module(db, tenant_name, module_clean)

        chapter_summary: list[str] = []
        for chapter_data in module_data.get("chapters", []):
            chapter_clean = {
                "course_id": created_course["id"],
                "module_id": created_module["id"],
                "title": chapter_data.get("title", ""),
                "position": chapter_data.get("position", 1),
                "content_type": chapter_data.get("content_type", "lesson"),
                "summary": chapter_data.get("summary", ""),
                "estimated_minutes": chapter_data.get("estimated_minutes", 20),
                "mandatory": chapter_data.get("mandatory", True),
                "question_prompt": chapter_data.get("question_prompt", ""),
                "video_url": chapter_data.get("video_url", ""),
            }
            if not chapter_clean["title"]:
                continue
            created_chapter = create_course_chapter(db, tenant_name, chapter_clean)
            chapter_summary.append(created_chapter["id"])

        summary.append({
            "module_id": created_module["id"],
            "week": created_module["week_number"],
            "title": created_module["title"],
            "chapter_ids": chapter_summary,
            "chapter_count": len(chapter_summary),
        })

    logger.info(
        "p01 import: created course=%s modules=%d chapters=%d (force=%s)",
        created_course["id"], len(summary),
        sum(m["chapter_count"] for m in summary), force,
    )
    return {
        "ok": True,
        "course": {"id": created_course["id"], "code": created_course["code"], "title": created_course["title"]},
        "modules": summary,
        "totals": {
            "modules": len(summary),
            "chapters": sum(m["chapter_count"] for m in summary),
        },
    }


@router.get("/courses/changes/secure")
def read_catalog_changes(
    tenant_name: str,
    limit: int = 100,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Admin-only audit log of catalog changes.

    Returns the N most recent change events recorded by the audit
    detector. Each event represents a single (course, field) change
    captured during a deploy. Visible in the /admin catalog history
    panel.
    """
    auth_dependency(db, tenant_name, x_academy_session, authorization, {"admin"})
    from app.catalog_audit import list_recent_changes

    capped = max(1, min(limit, 500))
    return {"items": list_recent_changes(db, limit=capped)}


@router.get("/applications")
def read_applications(tenant_name: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/applications/secure")
def read_applications_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES)
    return {"items": list_applications(db, tenant_name)}


@router.get("/applications/{application_id}")
def read_application(
    application_id: str,
    tenant_name: str,
    token: Optional[str] = None,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    item = get_application(db, tenant_name, application_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if token and token == item.get("public_receipt_token"):
        return {"item": item}
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES | {"student"})
    return {"item": item}


@router.post("/applications")
def create_application_route(payload: ApplicationCreate, db: Session = Depends(get_db)):
    """
    Create an application. Course → price mapping is authoritative on the
    server (apps/api/app/course_catalog.py); the client cannot influence
    the fee. The flow is:

      1. Client sends `course_code` (preferred) or `course_name`.
      2. Server looks up the canonical Course in the catalog.
      3. Server stamps `course_code`, `course_name`, `course_fee`,
         `cohort_label`, `amount_due`, `currency` onto the application
         row using the catalog's values.
      4. /applications/{id}/payment-link uses the row's `course_fee` for
         the Razorpay order, NOT anything the client supplies later.
      5. The webhook validates the captured amount equals `course_fee`
         in paise (a fraud check).
    """
    course = find_course(code=payload.course_code, name=payload.course_name)
    if course is None:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unknown course. Provide a valid course_code from the public catalog "
                "(apps/api/app/course_catalog.py)."
            ),
        )

    # Reservation-vs-live validation:
    #   - is_reservation=True  → course MUST be coming-soon AND have
    #                            reservation_fee_inr > 0
    #   - is_reservation=False → course MUST be open (existing behavior)
    # Clients cannot fake reservation status to bypass the coming-soon
    # block, and cannot apply to a coming-soon course without using the
    # reservation flow.
    if payload.is_reservation:
        if not course.coming_soon:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"{course.name} is currently accepting full applications — "
                    "use the standard application flow instead of Reserve a Seat."
                ),
            )
        if not course.reservation_fee_inr or course.reservation_fee_inr <= 0:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Reservation is not available for {course.name}. "
                    "Please contact admissions."
                ),
            )
    else:
        if not is_open_for_admissions(course):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"{course.name} is not yet open for full admissions. "
                    "Use Reserve a Seat to pay the advance and hold a place "
                    "for the next cohort."
                ),
            )

    # Build the canonical, server-controlled payload. Override anything the
    # client sent for the fee fields.
    body = payload.model_dump()
    body["course_code"] = course.code
    body["course_name"] = course.name
    body["course_fee"] = course.fee_inr
    body["cohort_label"] = course.cohort_label
    body["currency"] = "INR"
    body["is_reservation"] = payload.is_reservation

    if payload.is_reservation:
        # Reservation flow: amount_due is the advance (₹5,000), balance
        # tracked separately. balance_due_by stays None until cohort
        # is announced — see /courses/{code}/announce (todo).
        reservation_amount = float(course.reservation_fee_inr)
        balance_amount = float(course.fee_inr) - reservation_amount
        body["reservation_amount"] = reservation_amount
        body["balance_amount"] = balance_amount
        body["amount_due"] = reservation_amount
        body["reservation_paid_at"] = None
        body["balance_due_by"] = None
        body["balance_paid_at"] = None
    else:
        # Live flow: full fee due upfront, no reservation tracking.
        body["amount_due"] = float(course.fee_inr)
        body["reservation_amount"] = 0.0
        body["balance_amount"] = 0.0
        body["reservation_paid_at"] = None
        body["balance_due_by"] = None
        body["balance_paid_at"] = None

    item = create_application(db, payload.tenant_name, body)
    return {"ok": True, "item": item}


@router.post("/applications/{application_id}/status")
def update_application_status(application_id: str, payload: ApplicationStatusUpdate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/applications/{application_id}/status/secure")
def update_application_status_secure(
    application_id: str,
    payload: ApplicationStatusUpdate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, WRITE_ROLES)
    patch = payload.model_dump(exclude_none=True)
    patch.pop("tenant_name", None)
    item = _save_payment_transition(db, payload.tenant_name, application_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if item.get("application_stage") == "enrolled":
        item = assign_first_batch_if_needed(db, payload.tenant_name, application_id) or item
    return {"ok": True, "item": item}


@router.post("/applications/{application_id}/attendance")
def update_application_attendance(application_id: str, payload: ApplicationAttendanceUpdate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Use session attendance routes instead")


@router.post("/applications/{application_id}/attendance/secure")
def update_application_attendance_secure(
    application_id: str,
    payload: ApplicationAttendanceUpdate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    patch = payload.model_dump(exclude_none=True)
    patch.pop("tenant_name", None)
    item = update_application(db, payload.tenant_name, application_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"ok": True, "item": item}


@router.post("/applications/{application_id}/payment-link")
def create_application_payment_link(application_id: str, payload: PaymentLinkUpdate, db: Session = Depends(get_db)):
    application = get_application(db, payload.tenant_name, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.get("payment_stage") == "paid":
        raise HTTPException(status_code=409, detail="Payment is already completed for this application")

    # Course → price authority: re-resolve the LIVE catalog price every
    # time a payment link is generated. This means if the catalog price
    # changes between application submission and payment link creation,
    # the new price applies. The client cannot influence the amount.
    #
    # For reservations (Reserve a Seat flow), the chargeable amount is
    # the reservation_fee_inr (₹5,000), NOT the full course fee. The
    # balance is collected separately after cohort announcement.
    course_code = application.get("course_code")
    course_name = application.get("course_name")
    course = find_course(code=course_code, name=course_name)
    is_reservation = bool(application.get("is_reservation"))

    if course is not None:
        course_fee = float(course.fee_inr)
        reservation_amount = float(course.reservation_fee_inr)
        # If the catalog price has shifted since the application was created,
        # update the application row so receipts + admin UI reflect reality.
        stamped_fee = application.get("course_fee")
        stamped_reservation = application.get("reservation_amount", 0)
        catalog_drifted = (
            (stamped_fee is not None and float(stamped_fee) != course_fee)
            or (is_reservation and float(stamped_reservation) != reservation_amount)
        )
        if catalog_drifted:
            logger.info(
                "Application %s: catalog drift detected for %s — fee %s→%s reservation %s→%s",
                application_id, course.code, stamped_fee, course_fee,
                stamped_reservation, reservation_amount,
            )
            balance = course_fee - reservation_amount if is_reservation else 0.0
            application = _save_payment_transition(
                db,
                payload.tenant_name,
                application_id,
                {
                    "course_fee": course.fee_inr,
                    "course_name": course.name,
                    **(
                        {
                            "reservation_amount": reservation_amount,
                            "balance_amount": balance,
                        }
                        if is_reservation
                        else {}
                    ),
                },
            ) or application
    elif application.get("course_fee") is not None:
        course_fee = float(application["course_fee"])
        reservation_amount = float(application.get("reservation_amount", 0) or 0)
        logger.warning(
            "Application %s: course no longer in catalog (code=%s, name=%s); using stamped fee %s",
            application_id, course_code, course_name, course_fee,
        )
    else:
        # Legacy applications created before the catalog change.
        course_fee = float(application.get("amount_due", 0))
        reservation_amount = 0.0
        logger.warning(
            "Application %s has neither course_fee nor catalog match — falling back to amount_due (%s).",
            application_id, course_fee,
        )

    # Choose what to charge NOW. For reservations, charge the advance.
    chargeable_amount = reservation_amount if is_reservation else course_fee

    payment = create_payment_link(
        application_id=application_id,
        amount_due=chargeable_amount,
        currency="INR",
    )
    item = _save_payment_transition(
        db,
        payload.tenant_name,
        application_id,
        {
            "amount_due": payment["amount_due"],
            "currency": payment["currency"],
            "payment_order_id": payment["order_id"],
            "payment_reference": payment["payment_reference"],
            "payment_url": payment["payment_url"],
            "payment_mode": payment["mode"],
            "payment_gateway_status": "order_created",
            "payment_gateway_order_status": "created",
            "payment_gateway_payment_id": None,
            "payment_verified_at": None,
            "payment_failed_at": None,
            "payment_last_checked_at": None,
            "payment_reconciliation_status": "order_created",
            "application_stage": payload.application_stage or "payment_pending",
            "payment_stage": payload.payment_stage or "order_created",
        },
    )
    return {
        "ok": True,
        "item": item,
        "payment": payment,
    }


@router.post("/applications/{application_id}/payment/verify")
def verify_application_payment(application_id: str, payload: PaymentVerificationRequest, db: Session = Depends(get_db)):
    application = get_application(db, payload.tenant_name, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if payload.token and payload.token != application.get("public_receipt_token"):
        raise HTTPException(status_code=403, detail="Invalid receipt token")
    if not payload.token:
        raise HTTPException(status_code=400, detail="Receipt token required")

    item = _reconcile_application_payment(db, application, reported_outcome=payload.outcome)
    if item.get("payment_stage") == "paid":
        item = assign_first_batch_if_needed(db, payload.tenant_name, application_id) or item
    return {"ok": True, "item": item}


async def _capture_payment(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    reference: Optional[str] = None,
):
    # 1. Read the raw request body for signature verification
    body_bytes = await request.body()

    # 2. Verify HMAC-SHA256 signature from Razorpay
    webhook_secret = settings.razorpay_webhook_secret
    if not webhook_secret:
        logger.warning("RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_razorpay_signature):
        logger.warning("Razorpay webhook signature mismatch for reference=%s", reference)
        raise HTTPException(status_code=403, detail="Signature verification failed")

    # 3. Parse the event payload
    try:
        event = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event")
    event_id = event.get("id")

    # 4. Only act on payment.captured events
    if event_type != "payment.captured":
        return {"ok": True, "ignored": True, "event": event_type}

    # 4a. SECURITY (§17.2 C2): idempotency by Razorpay event.id.
    # Previously the only idempotency check was `payment_stage == "paid"`,
    # which doesn't catch refund→re-capture loops or replay attacks. Track
    # processed event IDs in the tenant state so we hard-skip duplicates.
    if event_id and was_webhook_event_processed(db, event_id):
        logger.info("Razorpay webhook: event %s already processed — short-circuit", event_id)
        return {"ok": True, "idempotent": True, "event_id": event_id}

    # 5. Resolve the application by payment_reference (or fallback id)
    application = _resolve_razorpay_application(db, event, reference)
    if application is None:
        logger.error("Razorpay webhook: no application found for reference=%s", reference or "static")
        raise HTTPException(status_code=404, detail="Application not found for this payment")

    tenant_name = application.get("tenant_name", "")

    # 5a. FRAUD CHECK — captured amount must equal the expected charge.
    # For reservations, that's the reservation_amount (₹5,000). For
    # standard applications, the full course_fee. Razorpay reports
    # `amount` in paise; our catalog stores rupees. If someone tampered
    # with the order to charge a smaller amount than expected, refuse
    # to mark the application paid.
    is_reservation = bool(application.get("is_reservation"))
    if is_reservation and not application.get("reservation_paid_at"):
        # First payment for a reservation → expected amount is the advance.
        expected_inr = application.get("reservation_amount") or application.get("amount_due")
    else:
        # Standard payment path (full fee, or balance payment after announce).
        expected_inr = application.get("course_fee")
        if expected_inr is None:
            expected_inr = application.get("amount_due")
    if expected_inr is not None:
        try:
            expected_paise = int(round(float(expected_inr) * 100))
            captured_paise = int(
                event.get("payload", {})
                     .get("payment", {})
                     .get("entity", {})
                     .get("amount", 0)
            )
            if captured_paise > 0 and captured_paise != expected_paise:
                logger.error(
                    "Razorpay webhook AMOUNT MISMATCH — application=%s expected=%spaise captured=%spaise. Refusing to mark paid.",
                    application["id"], expected_paise, captured_paise,
                )
                raise HTTPException(
                    status_code=409,
                    detail=f"Captured amount {captured_paise} does not match expected {expected_paise} for this application",
                )
        except (TypeError, ValueError) as fraud_err:
            logger.warning(
                "Razorpay webhook: could not validate captured amount for application=%s — %s",
                application["id"], fraud_err,
            )

    # 6. Secondary idempotency check — skip if already paid / enrolled.
    # For reservations we check reservation_paid_at; for full payments,
    # payment_stage == "paid".
    if is_reservation and application.get("reservation_paid_at"):
        logger.info(
            "Razorpay webhook: reservation %s already marked paid — skipping",
            application["id"],
        )
        return {"ok": True, "idempotent": True, "application_id": application["id"], "payment_stage": application.get("payment_stage")}
    if not is_reservation and application.get("payment_stage") == "paid":
        assigned = assign_first_batch_if_needed(db, tenant_name, application["id"]) or application
        logger.info(
            "Razorpay webhook: application %s already marked as paid — skipping",
            application["id"],
        )
        return {"ok": True, "idempotent": True, "application_id": assigned["id"], "payment_stage": assigned.get("payment_stage")}

    # 6a. Reservation branch — diverges from the standard full-payment flow:
    #   - Mark reservation_paid_at (timestamp)
    #   - payment_stage = "reservation_paid" (NOT "paid" — balance still due)
    #   - application_stage = "reserved" (NOT "enrolled" — no cohort yet)
    #   - Send confirmation email (graceful no-op if Resend not configured)
    #   - DO NOT issue student credentials yet (those come on full payment)
    #   - DO NOT assign to a batch (no batch until cohort announced)
    if is_reservation:
        razorpay_payment_id = (
            event.get("payload", {})
                 .get("payment", {})
                 .get("entity", {})
                 .get("id")
        )
        timestamp = now_iso()
        updated = _save_payment_transition(
            db,
            tenant_name,
            application["id"],
            {
                "reservation_paid_at": timestamp,
                "payment_verified_at": timestamp,
                "payment_gateway_status": "captured",
                "payment_gateway_payment_id": razorpay_payment_id,
                "payment_reconciliation_status": "captured",
                "payment_stage": "reservation_paid",
                "application_stage": "reserved",
            },
        ) or application

        # Send the reservation confirmation email. Failures here must NOT
        # roll back the payment — the student paid, the row is updated;
        # an undelivered email is a follow-up problem, not a payment problem.
        try:
            email_meta = render_reservation_confirmation_email(
                student_name=updated.get("student_name", ""),
                course_name=updated.get("course_name", ""),
                reservation_amount=float(updated.get("reservation_amount", 0) or 0),
                balance_amount=float(updated.get("balance_amount", 0) or 0),
                currency=updated.get("currency", "INR"),
            )
            send_email(
                to=updated.get("student_email", ""),
                subject=email_meta["subject"],
                html=email_meta["html"],
                text=email_meta["text"],
            )
        except Exception as email_err:  # noqa: BLE001
            logger.warning(
                "Reservation confirmation email failed for application=%s err=%s",
                application["id"], email_err,
            )

        # Record event_id for idempotency on retries.
        if event_id:
            try:
                record_webhook_event(db, event_id, source="razorpay", reference=reference or "")
            except Exception as record_err:  # noqa: BLE001
                logger.warning("Failed to record processed event_id=%s err=%s", event_id, record_err)

        logger.info(
            "Razorpay webhook: reservation captured — application=%s tenant=%s event_id=%s",
            application["id"], tenant_name, event_id,
        )
        return {"ok": True, "application_id": updated["id"], "payment_stage": updated.get("payment_stage")}

    updated = _reconcile_application_payment(db, application, reported_outcome="success")
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update application")

    # 8. Assign to first available batch if not already assigned
    if not updated.get("batch_id"):
        updated = assign_first_batch_if_needed(db, tenant_name, application["id"]) or updated

    # 9. Issue student credential. Idempotent: if a credential already
    # exists for this email, this is a no-op (no password rotation on
    # webhook retries). When it creates a new credential, we persist the
    # initial password on the application row so the academy team can
    # surface it via the messaging center / admin UI to deliver to the
    # student. Stored field: `initial_student_password`.
    student_email = updated.get("student_email") or application.get("student_email")
    student_name = updated.get("student_name") or application.get("student_name") or ""
    if student_email:
        try:
            credential, initial_password = ensure_student_credential(
                db,
                tenant_name,
                email=student_email,
                full_name=student_name,
            )
            if initial_password:
                # Newly-created credential. Persist the initial password on
                # the application row so an operator can retrieve and send
                # it to the student. Once the student logs in and changes
                # their password, this field can be cleared (admin UI todo).
                _save_payment_transition(
                    db,
                    tenant_name,
                    application["id"],
                    {"initial_student_password": initial_password},
                )
                logger.info(
                    "Razorpay webhook: student credential issued — email=%s tenant=%s",
                    student_email,
                    tenant_name,
                )
            elif credential is not None:
                logger.info(
                    "Razorpay webhook: student credential already exists — email=%s tenant=%s (no password rotation)",
                    student_email,
                    tenant_name,
                )
        except Exception as cred_error:  # noqa: BLE001
            # Never fail the webhook on credential issuance — payment was
            # captured and the application row is already paid. The
            # operator can retry credential creation manually from /admin.
            logger.error(
                "Razorpay webhook: credential issuance failed for application=%s email=%s err=%s",
                application["id"],
                student_email,
                cred_error,
            )

    # Record the event ID so any retry / replay will short-circuit at step 4a.
    if event_id:
        try:
            record_webhook_event(db, event_id, source="razorpay", reference=reference or "")
        except Exception as record_err:  # noqa: BLE001
            logger.warning("Failed to record processed event_id=%s err=%s", event_id, record_err)

    logger.info(
        "Razorpay webhook: payment.captured processed — application=%s tenant=%s event_id=%s",
        application["id"],
        tenant_name,
        event_id,
    )
    return {"ok": True, "application_id": updated["id"], "payment_stage": updated.get("payment_stage")}


@router.post("/payments/webhook/razorpay")
async def capture_payment_static(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    return await _capture_payment(request=request, x_razorpay_signature=x_razorpay_signature, db=db)


@router.post("/payments/webhook/razorpay/{reference}")
async def capture_payment(
    reference: str,
    request: Request,
    x_razorpay_signature: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    return await _capture_payment(
        request=request,
        x_razorpay_signature=x_razorpay_signature,
        db=db,
        reference=reference,
    )


@router.get("/students/me")
def read_student_me(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    session = auth_dependency(db, tenant_name, x_academy_session, authorization, {"student"})
    application = find_application_by_email(db, tenant_name, session["email"])
    if application is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    batches = list_batches(db, tenant_name)
    batch = next((item for item in batches if item["id"] == application.get("batch_id")), None)
    sessions = list_sessions(db, tenant_name, application.get("batch_id")) if application.get("batch_id") else []
    attendance = [
        item
        for session_item in sessions
        for item in list_attendance(db, tenant_name, session_item["id"])
        if item.get("application_id") == application["id"]
    ]
    return {
        "branding": get_tenant_state(db, tenant_name)["branding"],
        "student": {
            "name": session["full_name"],
            "email": session["email"],
            "role": session["role"],
        },
        "application": application,
        "batch": batch,
        "sessions": sessions,
        "attendance": attendance,
        "lms": get_student_lms_overview(db, tenant_name, application["id"]),
    }


@router.get("/courses/secure")
def read_courses_secure(
    tenant_name: str,
    application_id: Optional[str] = None,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES | {"student"})
    items = list_courses(db, tenant_name)
    return {
        "items": [get_course_outline(db, tenant_name, item["id"], application_id) or {"course": item, "modules": [], "progress": None} for item in items]
    }


@router.post("/courses/secure")
def create_course_secure(
    payload: CourseCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, WRITE_ROLES)
    return {"ok": True, "item": create_course(db, payload.tenant_name, payload.model_dump())}


@router.post("/courses/{course_id}/modules/secure")
def create_course_module_secure(
    course_id: str,
    payload: CourseModuleCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, WRITE_ROLES)
    data = payload.model_dump()
    data["course_id"] = course_id
    try:
        item = create_course_module(db, payload.tenant_name, data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, "item": item}


@router.post("/courses/{course_id}/modules/{module_id}/chapters/secure")
def create_course_chapter_secure(
    course_id: str,
    module_id: str,
    payload: CourseChapterCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, WRITE_ROLES)
    data = payload.model_dump()
    data["course_id"] = course_id
    data["module_id"] = module_id
    try:
        item = create_course_chapter(db, payload.tenant_name, data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, "item": item}


@router.get("/learners/{application_id}/lms/secure")
def read_learner_lms_secure(
    application_id: str,
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES | {"student"})
    item = get_student_lms_overview(db, tenant_name, application_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Learner LMS state not found")
    return item


@router.post("/learners/{application_id}/progress/secure")
def update_learner_progress_secure(
    application_id: str,
    payload: LearnerProgressUpdate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    patch = payload.model_dump(exclude_none=True)
    patch.pop("tenant_name", None)
    patch.pop("application_id", None)
    patch.pop("course_id", None)
    item = update_learner_progress(db, payload.tenant_name, application_id, payload.course_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Learner progress not found")
    return {"ok": True, "item": item}


@router.get("/submissions/secure")
def read_submissions_secure(
    tenant_name: str,
    application_id: Optional[str] = None,
    module_id: Optional[str] = None,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES | {"student"})
    return {"items": list_chapter_submissions(db, tenant_name, application_id=application_id, module_id=module_id)}


@router.post("/submissions/secure")
def create_submission_secure(
    payload: ChapterSubmissionCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES | {"student"})
    try:
        item = create_chapter_submission(db, payload.tenant_name, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, "item": item}


@router.get("/reviews/secure")
def read_reviews_secure(
    tenant_name: str,
    application_id: Optional[str] = None,
    module_id: Optional[str] = None,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    return {
        "items": list_trainer_reviews(db, tenant_name, application_id=application_id, module_id=module_id),
        "queue": get_trainer_review_queue(db, tenant_name),
    }


@router.post("/reviews/secure")
def create_review_secure(
    payload: TrainerReviewCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    SECURITY (§17.2 C4): bind `reviewer_name` and `reviewer_email` to the
    authenticated session. Previously the client could pass any string for
    `reviewer_name`, letting one trainer impersonate another in the audit
    trail. The session-derived values overwrite anything the client sent.
    """
    session = auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    body = payload.model_dump()
    body["reviewer_name"] = session["full_name"]
    body["reviewer_email"] = session["email"]
    body["reviewer_role"] = session["role"]
    try:
        item = create_trainer_review(db, payload.tenant_name, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, "item": item}


@router.get("/batches")
def read_batches(tenant_name: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/batches/secure")
def read_batches_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES)
    return {"items": list_batches(db, tenant_name)}


@router.post("/batches")
def create_batch_route(payload: BatchCreate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/batches/secure")
def create_batch_route_secure(
    payload: BatchCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, WRITE_ROLES)
    return {"ok": True, "item": create_batch(db, payload.tenant_name, payload.model_dump())}


@router.get("/sessions")
def read_sessions(tenant_name: str, batch_id: Optional[str] = None, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/sessions/secure")
def read_sessions_secure(
    tenant_name: str,
    batch_id: Optional[str] = None,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES)
    return {"items": list_sessions(db, tenant_name, batch_id)}


@router.post("/sessions")
def create_session_route(payload: SessionCreate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/sessions/secure")
def create_session_route_secure(
    payload: SessionCreate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, WRITE_ROLES)
    return {"ok": True, "item": create_session(db, payload.tenant_name, payload.model_dump())}


@router.get("/sessions/{session_id}/attendance")
def read_session_attendance(session_id: str, tenant_name: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/sessions/{session_id}/attendance/secure")
def read_session_attendance_secure(
    session_id: str,
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    return {"items": list_attendance(db, tenant_name, session_id)}


@router.post("/sessions/{session_id}/attendance")
def write_session_attendance(session_id: str, payload: SessionAttendanceUpdate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/sessions/{session_id}/attendance/secure")
def write_session_attendance_secure(
    session_id: str,
    payload: SessionAttendanceUpdate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    item = mark_attendance(
        db,
        payload.tenant_name,
        {
            "session_id": session_id,
            "application_id": payload.application_id,
            "status": payload.status,
            "marked_by": payload.marked_by,
            "join_source": payload.join_source,
            "join_time": payload.join_time,
            "note": payload.note,
        },
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"ok": True, "item": item}


@router.post("/sessions/{session_id}/zoom/provision")
def provision_session_zoom(session_id: str, payload: ZoomProvisionRequest, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/sessions/{session_id}/zoom/provision/secure")
def provision_session_zoom_secure(
    session_id: str,
    payload: ZoomProvisionRequest,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    session = get_session(db, payload.tenant_name, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    zoom = provision_zoom_meeting(
        tenant_name=payload.tenant_name,
        session_id=session_id,
        session_title=session["title"],
        session_date=session["session_date"],
        start_time=session["start_time"],
        end_time=session["end_time"],
        host_email=payload.host_email,
        timezone=payload.timezone,
    )
    item = update_session(
        db,
        payload.tenant_name,
        session_id,
        {
            "classroom_link": zoom["join_url"],
            "zoom_meeting_id": zoom["meeting_id"],
            "zoom_join_url": zoom["join_url"],
            "zoom_start_url": zoom["start_url"],
            "attendance_mode": "join-tracked",
        },
    )
    return {"ok": True, "item": item, "zoom": zoom}


@router.post("/sessions/{session_id}/zoom")
def update_session_zoom_state(session_id: str, payload: SessionZoomUpdate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/sessions/{session_id}/zoom/secure")
def update_session_zoom_state_secure(
    session_id: str,
    payload: SessionZoomUpdate,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    patch = payload.model_dump(exclude_none=True)
    patch.pop("tenant_name", None)
    item = update_session(db, payload.tenant_name, session_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True, "item": item}


@router.post("/zoom/webhook")
def process_zoom_webhook(
    payload: ZoomWebhookAttendance,
    request: Request,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Zoom Marketplace webhook handler.

    SECURITY (§17.2 C1): Zoom delivers webhooks with an Authorization header
    matching the verification token configured on the app. We compare it
    constant-time against `settings.zoom_webhook_secret_token`. Without this
    check, anyone could POST forged 'auto-present' attendance for any learner.
    Behaviour:
      - If `ZOOM_WEBHOOK_SECRET_TOKEN` is unset, the endpoint refuses ALL
        requests in production (400). Local dev with the token unset is the
        only path that gets through, intentionally.
      - If the token is set but the request omits it or sends the wrong
        value, return 401.
      - On match, proceed.
    """
    expected = settings.zoom_webhook_secret_token
    if not expected:
        if settings.app_env == "production":
            logger.error("Zoom webhook received but ZOOM_WEBHOOK_SECRET_TOKEN is not configured")
            raise HTTPException(status_code=400, detail="Zoom webhook not configured")
    else:
        # Zoom sends the verification token directly in the Authorization header.
        provided = (authorization or "").strip()
        if not provided or not hmac.compare_digest(provided, expected):
            logger.warning("Zoom webhook rejected: bad or missing Authorization header")
            raise HTTPException(status_code=401, detail="Invalid Zoom webhook authorization")

    session = find_session_by_zoom_meeting_id(db, payload.tenant_name, payload.zoom_meeting_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    application = find_application_by_email(db, payload.tenant_name, payload.participant_email)
    if application is None:
        raise HTTPException(status_code=404, detail="Learner not found")
    item = mark_attendance(
        db,
        payload.tenant_name,
        {
            "session_id": session["id"],
            "application_id": application["id"],
            "status": "auto-present",
            "marked_by": "system",
            "join_source": "live-class",
            "join_time": payload.join_time,
            "note": payload.note or "Captured from Zoom join event.",
        },
    )
    return {
        "ok": True,
        "session_id": session["id"],
        "application_id": application["id"],
        "item": item,
    }


@router.get("/state/{tenant_name}")
def read_full_state(tenant_name: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/state/{tenant_name}/secure")
def read_full_state_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES)
    return get_tenant_state(db, tenant_name)


@router.post("/state/{tenant_name}")
def overwrite_full_state(tenant_name: str, payload: dict, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/state/{tenant_name}/secure")
def overwrite_full_state_secure(
    tenant_name: str,
    payload: dict,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, WRITE_ROLES)
    return save_tenant_state(db, tenant_name, payload)


@router.get("/messages/secure")
def read_messages_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES)
    state = get_tenant_state(db, tenant_name)
    sent_events = list_message_events(db, tenant_name)
    sent_by_message_id = {item.get("message_id"): item for item in sent_events if item.get("message_id")}
    messages = []
    applications = list_applications(db, tenant_name)
    sessions = list_sessions(db, tenant_name)

    for application in applications:
        if application.get("application_stage") == "applied":
            messages.append(
                {
                    "id": f"msg_email_{application['id']}",
                    "channel": "email",
                    "audience": application["student_email"],
                    "purpose": "Application received confirmation",
                    "status": "ready",
                    "trigger": "Immediately after form submission",
                    "template": "application_received",
                }
            )
        if application.get("payment_stage") in {"not_started", "order_created"}:
            messages.append(
                {
                    "id": f"msg_whatsapp_{application['id']}",
                    "channel": "whatsapp",
                    "audience": application["student_phone"] or application["student_email"],
                    "purpose": "Application fee reminder",
                    "status": "pending",
                    "trigger": "If payment is not completed within 6 hours",
                    "template": "payment_reminder",
                }
            )

    for session in sessions[:6]:
        messages.append(
            {
                "id": f"msg_zoom_{session['id']}",
                "channel": "zoom",
                "audience": session.get("trainer_name", "Batch attendees"),
                "purpose": f"Class reminder for {session['title']}",
                "status": "scheduled" if session.get("zoom_join_url") else "needs-setup",
                "trigger": f"2 hours before {session['session_date']} {session['start_time']}",
                "template": "class_reminder",
            }
        )

    for item in messages:
        prior = sent_by_message_id.get(item["id"])
        if prior:
            item["status"] = prior.get("status", item["status"])
            item["last_sent_at"] = prior.get("created_at")
            item["note"] = prior.get("note", "")

    return {
        "branding": state["branding"],
        "items": messages,
    }


@router.post("/messages/dispatch/secure")
def dispatch_message_secure(
    payload: dict,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    tenant_name = str(payload.get("tenant_name", "")).strip()
    if not tenant_name:
        raise HTTPException(status_code=400, detail="tenant_name is required")
    session = auth_dependency(db, tenant_name, x_academy_session, authorization, READ_ROLES)
    item = create_message_event(
        db,
        tenant_name,
        {
            "message_id": payload.get("message_id"),
            "channel": payload.get("channel"),
            "audience": payload.get("audience"),
            "purpose": payload.get("purpose"),
            "template": payload.get("template"),
            "status": "sent",
            "note": f"Triggered by {session['full_name']} from the academy messaging center.",
        },
    )
    return {"ok": True, "item": item}
