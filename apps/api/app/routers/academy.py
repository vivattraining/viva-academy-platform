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
    list_credentials,
    login_user,
    revoke_session,
    revoke_sessions_for_email,
    tenant_has_credentials,
    update_credential,
)
from app.config import settings
from app.db import get_db
from app.integrations import create_payment_link, fetch_payment_status, provision_zoom_meeting, razorpay_mode
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
def academy_bootstrap_admin(payload: BootstrapAdminRequest, db: Session = Depends(get_db)):
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
    item = create_application(db, payload.tenant_name, payload.model_dump())
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
    payment = create_payment_link(
        application_id=application_id,
        amount_due=payload.amount_due if payload.amount_due is not None else float(application.get("amount_due", 0)),
        currency=payload.currency or application.get("currency", "INR"),
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

    # 4. Only act on payment.captured events
    if event_type != "payment.captured":
        return {"ok": True, "ignored": True, "event": event_type}

    # 5. Resolve the application by payment_reference (or fallback id)
    application = _resolve_razorpay_application(db, event, reference)
    if application is None:
        logger.error("Razorpay webhook: no application found for reference=%s", reference or "static")
        raise HTTPException(status_code=404, detail="Application not found for this payment")

    tenant_name = application.get("tenant_name", "")

    # 6. Idempotency check — skip if already paid / enrolled
    if application.get("payment_stage") == "paid":
        assigned = assign_first_batch_if_needed(db, tenant_name, application["id"]) or application
        logger.info(
            "Razorpay webhook: application %s already marked as paid — skipping",
            application["id"],
        )
        return {"ok": True, "idempotent": True, "application_id": assigned["id"], "payment_stage": assigned.get("payment_stage")}

    updated = _reconcile_application_payment(db, application, reported_outcome="success")
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update application")

    # 8. Assign to first available batch if not already assigned
    if not updated.get("batch_id"):
        updated = assign_first_batch_if_needed(db, tenant_name, application["id"]) or updated

    logger.info(
        "Razorpay webhook: payment.captured processed — application=%s tenant=%s",
        application["id"],
        tenant_name,
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
    auth_dependency(db, payload.tenant_name, x_academy_session, authorization, TRAINER_ROLES)
    try:
        item = create_trainer_review(db, payload.tenant_name, payload.model_dump())
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
def process_zoom_webhook(payload: ZoomWebhookAttendance, db: Session = Depends(get_db)):
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
