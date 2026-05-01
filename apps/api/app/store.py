from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
import secrets
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import AcademyTenantState, AcademyWebhookEvent


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:18]}"


def _default_branding(tenant_name: str) -> dict:
    return {
        "tenant_name": tenant_name,
        "brand_name": "Viva Career Academy",
        "academy_name": "Viva Career Academy",
        "custom_domain": "www.vivacareeracademy.com",
        "primary_color": "#0B1F3A",
        "accent_color": "#F4B400",
        "support_email": "support@vivacareeracademy.com",
        "certificate_name": "Professional Certification in Travel & Tourism",
        "classroom_provider": "zoom",
        "zoom_host_email": "tech@vivacareeracademy.com",
        "zoom_default_timezone": "Asia/Kolkata",
    }


def _safe_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _find_by_id(items: list[dict], item_id: str) -> Optional[dict]:
    return next((item for item in items if item.get("id") == item_id), None)


def _ensure_lms_collections(state: dict) -> dict:
    state.setdefault("courses", [])
    state.setdefault("course_modules", [])
    state.setdefault("course_chapters", [])
    state.setdefault("chapter_submissions", [])
    state.setdefault("learner_progress", [])
    state.setdefault("trainer_reviews", [])
    return state


def _default_lms_seed(tenant_name: str, batch_id: str, application_id: str, current: str) -> dict:
    course_id = "course_viva_flagship"
    module_1_id = "mod_viva_week_01"
    module_2_id = "mod_viva_week_02"
    module_3_id = "mod_viva_week_03"
    chapter_1_id = "chap_viva_week_01_intro"
    chapter_2_id = "chap_viva_week_01_customer"
    chapter_3_id = "chap_viva_week_02_fit"
    chapter_4_id = "chap_viva_week_02_pricing"
    submission_id = "sub_viva_demo_01"
    review_id = "review_viva_demo_01"
    return {
        "courses": [
            {
                "id": course_id,
                "tenant_name": tenant_name,
                "title": "Professional Certification in Travel & Tourism",
                "slug": "travel-professional-certification",
                "code": "VCA-TT-12",
                "description": "Flagship 12-week pathway with weekly unlock discipline and trainer-reviewed chapter submissions.",
                "duration_weeks": 12,
                "weekly_unlock_days": 7,
                "penalty_fee_amount": 2000,
                "penalty_fee_currency": "INR",
                "relock_grace_days": 2,
                "certificate_name": "Professional Certification in Travel & Tourism",
                "active": True,
                "created_at": current,
                "updated_at": current,
            }
        ],
        "course_modules": [
            {
                "id": module_1_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "title": "Week 01 · Travel Industry Foundations",
                "week_number": 1,
                "summary": "Sector orientation, customer journey, and academy expectations.",
                "unlock_offset_days": 0,
                "submission_required": True,
                "passing_score": 70,
                "penalty_fee_amount": 2000,
                "penalty_fee_currency": "INR",
                "relock_grace_days": 2,
                "created_at": current,
                "updated_at": current,
            },
            {
                "id": module_2_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "title": "Week 02 · FIT Itinerary Planning",
                "week_number": 2,
                "summary": "Build itinerary logic and basic traveler matching.",
                "unlock_offset_days": 7,
                "submission_required": True,
                "passing_score": 70,
                "penalty_fee_amount": 2000,
                "penalty_fee_currency": "INR",
                "relock_grace_days": 2,
                "created_at": current,
                "updated_at": current,
            },
            {
                "id": module_3_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "title": "Week 03 · Costing and Pricing",
                "week_number": 3,
                "summary": "Margin discipline, package pricing, and commercial clarity.",
                "unlock_offset_days": 14,
                "submission_required": True,
                "passing_score": 75,
                "penalty_fee_amount": 2000,
                "penalty_fee_currency": "INR",
                "relock_grace_days": 2,
                "created_at": current,
                "updated_at": current,
            },
        ],
        "course_chapters": [
            {
                "id": chapter_1_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "module_id": module_1_id,
                "title": "Chapter 1 · Industry Overview",
                "position": 1,
                "content_type": "lesson",
                "summary": "Understand the travel trade landscape and stakeholder map.",
                "estimated_minutes": 18,
                "mandatory": True,
                "question_prompt": "Summarize how retail, wholesale, and DMC roles differ in one itinerary journey.",
                "created_at": current,
                "updated_at": current,
            },
            {
                "id": chapter_2_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "module_id": module_1_id,
                "title": "Chapter 2 · Customer Intent Mapping",
                "position": 2,
                "content_type": "assignment",
                "summary": "Translate learner discovery notes into travel recommendations.",
                "estimated_minutes": 25,
                "mandatory": True,
                "question_prompt": "Write a short response to a honeymoon inquiry focused on privacy and premium feel.",
                "created_at": current,
                "updated_at": current,
            },
            {
                "id": chapter_3_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "module_id": module_2_id,
                "title": "Chapter 1 · FIT Itinerary Logic",
                "position": 1,
                "content_type": "lesson",
                "summary": "Sequence destinations and nights around traveler priorities.",
                "estimated_minutes": 22,
                "mandatory": True,
                "question_prompt": "Outline a 5-night Bali split for a premium honeymoon couple.",
                "created_at": current,
                "updated_at": current,
            },
            {
                "id": chapter_4_id,
                "tenant_name": tenant_name,
                "course_id": course_id,
                "module_id": module_3_id,
                "title": "Chapter 1 · Margin Discipline",
                "position": 1,
                "content_type": "assignment",
                "summary": "Apply markup rules and protect contribution margin.",
                "estimated_minutes": 30,
                "mandatory": True,
                "question_prompt": "Explain how you would protect margin when a client asks for a discount.",
                "created_at": current,
                "updated_at": current,
            },
        ],
        "chapter_submissions": [
            {
                "id": submission_id,
                "tenant_name": tenant_name,
                "application_id": application_id,
                "course_id": course_id,
                "module_id": module_1_id,
                "chapter_id": chapter_2_id,
                "answer_text": "I would recommend two quiet Ubud nights plus three beach nights in Seminyak, framing privacy, spa options, and availability urgency.",
                "answer_url": None,
                "submission_kind": "text",
                "status": "reviewed",
                "submitted_at": current,
                "created_at": current,
                "updated_at": current,
            }
        ],
        "learner_progress": [
            {
                "id": "progress_viva_demo_01",
                "tenant_name": tenant_name,
                "application_id": application_id,
                "course_id": course_id,
                "batch_id": batch_id,
                "current_week": 2,
                "current_module_id": module_2_id,
                "status": "active",
                "module_status": "in_progress",
                "chapter_status": "in_review",
                "completed_chapter_ids": [chapter_1_id],
                "submitted_chapter_ids": [chapter_2_id],
                "reviewed_submission_ids": [submission_id],
                "unlock_override": False,
                "last_unlocked_at": current,
                "last_activity_at": current,
                "penalty_status": "clear",
                "penalty_fee_amount": 2000,
                "penalty_fee_currency": "INR",
                "penalty_paid_at": None,
                "note": "Seeded LMS progress for learner workspace.",
                "created_at": current,
                "updated_at": current,
            }
        ],
        "trainer_reviews": [
            {
                "id": review_id,
                "tenant_name": tenant_name,
                "submission_id": submission_id,
                "application_id": application_id,
                "course_id": course_id,
                "module_id": module_1_id,
                "chapter_id": chapter_2_id,
                "reviewer_name": "Vikas Khanduri",
                "outcome": "pass",
                "score": 82,
                "ai_feedback": "AI draft suggested stronger urgency and clearer personalization.",
                "trainer_feedback": "Good structure. Keep the close tighter and specify why the split fits the honeymoon brief.",
                "unlock_next_module": True,
                "reviewed_at": current,
                "created_at": current,
                "updated_at": current,
            }
        ],
    }


def _course_for_application(state: dict, application: dict) -> Optional[dict]:
    courses = state.get("courses", [])
    normalized_name = str(application.get("course_name", "")).strip().lower()
    return next(
        (
            item
            for item in courses
            if str(item.get("title", "")).strip().lower() == normalized_name
            or str(item.get("certificate_name", "")).strip().lower() == normalized_name
        ),
        courses[0] if courses else None,
    )


def _module_unlock_snapshot(course: dict, module: dict, batch: Optional[dict], progress: Optional[dict]) -> dict:
    start_date = _safe_date((batch or {}).get("start_date"))
    unlock_offset = int(module.get("unlock_offset_days", max(int(module.get("week_number", 1)) - 1, 0) * int(course.get("weekly_unlock_days", 7))))
    unlock_date = start_date + timedelta(days=unlock_offset) if start_date else None
    weekly_days = int(course.get("weekly_unlock_days", 7) or 7)
    deadline_date = unlock_date + timedelta(days=weekly_days) if unlock_date else None
    grace_days = int(module.get("relock_grace_days", course.get("relock_grace_days", 2)) or 2)
    relock_date = deadline_date + timedelta(days=grace_days) if deadline_date else None
    today = datetime.now(timezone.utc).date()
    unlock_override = bool((progress or {}).get("unlock_override"))
    is_unlocked = unlock_override or unlock_date is None or today >= unlock_date
    is_overdue = bool(deadline_date and today > deadline_date)
    is_relocked = bool(relock_date and today > relock_date and not unlock_override)
    penalty_ready = bool(is_relocked and str((progress or {}).get("penalty_status", "clear")) != "paid")
    return {
        "unlock_date": unlock_date.isoformat() if unlock_date else None,
        "deadline_date": deadline_date.isoformat() if deadline_date else None,
        "relock_date": relock_date.isoformat() if relock_date else None,
        "is_unlocked": is_unlocked,
        "is_overdue": is_overdue,
        "is_relocked": is_relocked,
        "penalty_ready": penalty_ready,
        "penalty_fee_amount": float(module.get("penalty_fee_amount", course.get("penalty_fee_amount", 0)) or 0),
        "penalty_fee_currency": module.get("penalty_fee_currency", course.get("penalty_fee_currency", "INR")),
        "relock_grace_days": grace_days,
    }


def default_state(tenant_name: str) -> dict:
    current = now_iso()
    batch_id = "batch_viva_01"
    demo_application_id = "acad_demo_student_01"
    state = {
        "tenant_name": tenant_name,
        "branding": _default_branding(tenant_name),
        "applications": [
            {
                "id": demo_application_id,
                "tenant_name": tenant_name,
                "batch_id": batch_id,
                "student_name": "Demo Student",
                "student_email": "student@viva.demo",
                "student_phone": "+91 98765 43210",
                "course_name": "Travel Professional Certification",
                "source": "internal-demo",
                "notes": "Seeded learner for student experience walkthroughs.",
                "application_stage": "enrolled",
                "payment_stage": "paid",
                "enrollment_stage": "active",
                "amount_due": 2500.0,
                "currency": "INR",
                "payment_order_id": "order_demo_student_01",
                "payment_url": "https://payments.vivacareeracademy.com/demo/order_demo_student_01",
                "payment_reference": "payref_demo_student_01",
                "payment_mode": "mock",
                "payment_gateway_status": "mock_captured",
                "payment_gateway_order_status": "paid",
                "payment_gateway_payment_id": "mockpay_demo_student_01",
                "payment_reconciliation_status": "verified",
                "payment_verified_at": current,
                "payment_failed_at": None,
                "payment_last_checked_at": current,
                "certificate_url": None,
                "attendance_completed": 1,
                "attendance_total": 12,
                "created_at": current,
                "updated_at": current,
            }
        ],
        "batches": [
            {
                "id": batch_id,
                "tenant_name": tenant_name,
                "name": "VCA Batch 01",
                "course_name": "Professional Certification in Travel & Tourism",
                "start_date": "2026-05-04",
                "trainer_name": "Vikas Khanduri",
                "classroom_mode": "hybrid",
                "classroom_link": "https://www.vivacareeracademy.com/classrooms/batch-01",
                "zoom_meeting_id": None,
                "capacity": 20,
                "created_at": current,
                "updated_at": current,
            }
        ],
        "sessions": [
            {
                "id": "sess_viva_01",
                "tenant_name": tenant_name,
                "batch_id": batch_id,
                "title": "Orientation and industry overview",
                "session_date": "2026-05-04",
                "start_time": "11:00",
                "end_time": "12:30",
                "trainer_name": "Vikas Khanduri",
                "classroom_link": "https://www.vivacareeracademy.com/classrooms/batch-01",
                "zoom_meeting_id": None,
                "zoom_join_url": None,
                "zoom_start_url": None,
                "attendance_mode": "hybrid",
                "created_at": current,
                "updated_at": current,
            },
            {
                "id": "sess_viva_02",
                "tenant_name": tenant_name,
                "batch_id": batch_id,
                "title": "Itinerary planning lab",
                "session_date": "2026-05-11",
                "start_time": "11:00",
                "end_time": "12:30",
                "trainer_name": "Guest Faculty",
                "classroom_link": "https://www.vivacareeracademy.com/classrooms/batch-01",
                "zoom_meeting_id": None,
                "zoom_join_url": None,
                "zoom_start_url": None,
                "attendance_mode": "join-tracked",
                "created_at": current,
                "updated_at": current,
            },
        ],
        "attendance": [
            {
                "id": "att_demo_student_01",
                "tenant_name": tenant_name,
                "session_id": "sess_viva_01",
                "application_id": demo_application_id,
                "student_name": "Demo Student",
                "student_email": "student@viva.demo",
                "status": "present",
                "marked_by": "system",
                "join_source": "seeded-demo",
                "join_time": current,
                "note": "Seeded attendance for the demo learner workspace.",
                "created_at": current,
                "updated_at": current,
            }
        ],
        "message_events": [],
    }
    state.update(_default_lms_seed(tenant_name, batch_id, demo_application_id, current))
    return _ensure_lms_collections(state)


def get_tenant_state(db: Session, tenant_name: str) -> dict:
    record = db.query(AcademyTenantState).filter(AcademyTenantState.tenant_name == tenant_name).first()
    if record is None:
        current = now_iso()
        seed = default_state(tenant_name)
        record = AcademyTenantState(
            tenant_name=tenant_name,
            state=seed,
            created_at=current,
            updated_at=current,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return _ensure_lms_collections(deepcopy(record.state or default_state(tenant_name)))


def save_tenant_state(db: Session, tenant_name: str, state: dict) -> dict:
    record = db.query(AcademyTenantState).filter(AcademyTenantState.tenant_name == tenant_name).first()
    next_state = _ensure_lms_collections(deepcopy(state))
    next_state["tenant_name"] = tenant_name
    current = now_iso()
    if record is None:
        record = AcademyTenantState(
            tenant_name=tenant_name,
            state=next_state,
            created_at=current,
            updated_at=current,
        )
        db.add(record)
    else:
        record.state = next_state
        record.updated_at = current
    db.commit()
    return get_tenant_state(db, tenant_name)


def find_tenant_by_domain(db: Session, domain: str) -> Optional[dict]:
    normalized = domain.strip().lower()
    for record in db.query(AcademyTenantState).all():
        state = record.state or {}
        branding = state.get("branding", {})
        if str(branding.get("custom_domain", "")).strip().lower() == normalized:
            return deepcopy(state)
    return None


def get_branding(db: Session, tenant_name: str) -> dict:
    return get_tenant_state(db, tenant_name)["branding"]


def update_branding(db: Session, tenant_name: str, patch: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    state["branding"] = {
        **state.get("branding", _default_branding(tenant_name)),
        **patch,
        "tenant_name": tenant_name,
    }
    return save_tenant_state(db, tenant_name, state)["branding"]


def list_items(db: Session, tenant_name: str, key: str) -> list[dict]:
    state = get_tenant_state(db, tenant_name)
    return deepcopy(state.get(key, []))


def list_applications(db: Session, tenant_name: str) -> list[dict]:
    items = list_items(db, tenant_name, "applications")
    return sorted(items, key=lambda item: item.get("updated_at", ""), reverse=True)


def get_application(db: Session, tenant_name: str, application_id: str) -> Optional[dict]:
    return next((item for item in list_items(db, tenant_name, "applications") if item["id"] == application_id), None)


def create_application(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    record = {
        "id": make_id("acad"),
        "tenant_name": tenant_name,
        "batch_id": None,
        "student_name": payload["student_name"].strip(),
        "student_email": payload["student_email"].strip().lower(),
        "student_phone": payload.get("student_phone", "").strip(),
        "course_name": payload["course_name"].strip(),
        "source": payload.get("source", "website").strip(),
        "notes": payload.get("notes", "").strip(),
        "application_stage": "applied",
        "payment_stage": "not_started",
        "enrollment_stage": "prospect",
        "amount_due": float(payload.get("amount_due", 0) or 0),
        "currency": payload.get("currency", "INR").strip().upper(),
        "payment_order_id": None,
        "payment_url": None,
        "payment_reference": None,
        "payment_mode": None,
        "payment_gateway_status": "not_started",
        "payment_gateway_order_status": None,
        "payment_gateway_payment_id": None,
        "payment_reconciliation_status": "not_started",
        "payment_verified_at": None,
        "payment_failed_at": None,
        "payment_last_checked_at": None,
        "public_receipt_token": secrets.token_urlsafe(18),
        "certificate_url": None,
        "attendance_completed": 0,
        "attendance_total": 12,
        "created_at": current,
        "updated_at": current,
    }
    state["applications"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def update_application(db: Session, tenant_name: str, application_id: str, patch: dict) -> Optional[dict]:
    state = get_tenant_state(db, tenant_name)
    for index, item in enumerate(state["applications"]):
        if item["id"] == application_id:
            state["applications"][index] = {
                **item,
                **patch,
                "updated_at": now_iso(),
            }
            save_tenant_state(db, tenant_name, state)
            return state["applications"][index]
    return None


def find_application_by_reference(db: Session, reference: str) -> Optional[dict]:
    for record in db.query(AcademyTenantState).all():
        state = record.state or {}
        for item in state.get("applications", []):
            if item.get("payment_reference") == reference or item.get("id") == reference:
                return deepcopy(item)
    return None


def find_application_by_order_id(db: Session, order_id: str) -> Optional[dict]:
    for record in db.query(AcademyTenantState).all():
        state = record.state or {}
        for item in state.get("applications", []):
            if item.get("payment_order_id") == order_id:
                return deepcopy(item)
    return None


def find_application_by_email(db: Session, tenant_name: str, email: str) -> Optional[dict]:
    normalized = email.strip().lower()
    return next((item for item in list_items(db, tenant_name, "applications") if item.get("student_email") == normalized), None)


def list_batches(db: Session, tenant_name: str) -> list[dict]:
    items = list_items(db, tenant_name, "batches")
    return sorted(items, key=lambda item: item.get("updated_at", ""), reverse=True)


def create_batch(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    record = {
        "id": make_id("batch"),
        "tenant_name": tenant_name,
        "name": payload["name"].strip(),
        "course_name": payload["course_name"].strip(),
        "start_date": payload["start_date"].strip(),
        "trainer_name": payload["trainer_name"].strip(),
        "classroom_mode": payload.get("classroom_mode", "hybrid"),
        "classroom_link": payload.get("classroom_link", ""),
        "zoom_meeting_id": payload.get("zoom_meeting_id"),
        "capacity": int(payload.get("capacity", 20) or 20),
        "created_at": current,
        "updated_at": current,
    }
    state["batches"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def list_courses(db: Session, tenant_name: str) -> list[dict]:
    items = list_items(db, tenant_name, "courses")
    return sorted(items, key=lambda item: item.get("created_at", ""))


def create_course(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    record = {
        "id": make_id("course"),
        "tenant_name": tenant_name,
        "title": payload["title"].strip(),
        "slug": payload["slug"].strip(),
        "code": payload["code"].strip(),
        "description": payload.get("description", "").strip(),
        "duration_weeks": int(payload.get("duration_weeks", 12) or 12),
        "weekly_unlock_days": int(payload.get("weekly_unlock_days", 7) or 7),
        "penalty_fee_amount": float(payload.get("penalty_fee_amount", 2000) or 0),
        "penalty_fee_currency": payload.get("penalty_fee_currency", "INR").strip().upper(),
        "relock_grace_days": int(payload.get("relock_grace_days", 2) or 2),
        "certificate_name": payload.get("certificate_name") or payload["title"].strip(),
        "active": bool(payload.get("active", True)),
        "created_at": current,
        "updated_at": current,
    }
    state["courses"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def list_course_modules(db: Session, tenant_name: str, course_id: str) -> list[dict]:
    items = list_items(db, tenant_name, "course_modules")
    filtered = [item for item in items if item.get("course_id") == course_id]
    return sorted(filtered, key=lambda item: (int(item.get("week_number", 0)), item.get("title", "")))


def create_course_module(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    course = _find_by_id(state["courses"], payload["course_id"])
    if course is None:
        raise ValueError("Course not found")
    record = {
        "id": make_id("mod"),
        "tenant_name": tenant_name,
        "course_id": payload["course_id"],
        "title": payload["title"].strip(),
        "week_number": int(payload["week_number"]),
        "summary": payload.get("summary", "").strip(),
        "unlock_offset_days": int(payload.get("unlock_offset_days", max(int(payload["week_number"]) - 1, 0) * int(course.get("weekly_unlock_days", 7)))),
        "submission_required": bool(payload.get("submission_required", True)),
        "passing_score": float(payload.get("passing_score", 70) or 70),
        "penalty_fee_amount": float(payload.get("penalty_fee_amount", course.get("penalty_fee_amount", 2000)) or 0),
        "penalty_fee_currency": payload.get("penalty_fee_currency", course.get("penalty_fee_currency", "INR")).strip().upper(),
        "relock_grace_days": int(payload.get("relock_grace_days", course.get("relock_grace_days", 2)) or 2),
        "created_at": current,
        "updated_at": current,
    }
    state["course_modules"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def list_course_chapters(db: Session, tenant_name: str, module_id: str) -> list[dict]:
    items = list_items(db, tenant_name, "course_chapters")
    filtered = [item for item in items if item.get("module_id") == module_id]
    return sorted(filtered, key=lambda item: (int(item.get("position", 0)), item.get("title", "")))


def create_course_chapter(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    if _find_by_id(state["courses"], payload["course_id"]) is None:
        raise ValueError("Course not found")
    if _find_by_id(state["course_modules"], payload["module_id"]) is None:
        raise ValueError("Module not found")
    record = {
        "id": make_id("chap"),
        "tenant_name": tenant_name,
        "course_id": payload["course_id"],
        "module_id": payload["module_id"],
        "title": payload["title"].strip(),
        "position": int(payload["position"]),
        "content_type": payload.get("content_type", "lesson").strip(),
        "summary": payload.get("summary", "").strip(),
        "estimated_minutes": int(payload.get("estimated_minutes", 20) or 20),
        "mandatory": bool(payload.get("mandatory", True)),
        "question_prompt": payload.get("question_prompt", "").strip(),
        "created_at": current,
        "updated_at": current,
    }
    state["course_chapters"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def list_sessions(db: Session, tenant_name: str, batch_id: Optional[str] = None) -> list[dict]:
    items = list_items(db, tenant_name, "sessions")
    filtered = [item for item in items if not batch_id or item["batch_id"] == batch_id]
    return sorted(filtered, key=lambda item: f'{item.get("session_date", "")} {item.get("start_time", "")}')


def get_session(db: Session, tenant_name: str, session_id: str) -> Optional[dict]:
    return next((item for item in list_items(db, tenant_name, "sessions") if item["id"] == session_id), None)


def create_session(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    record = {
        "id": make_id("sess"),
        "tenant_name": tenant_name,
        "batch_id": payload["batch_id"],
        "title": payload["title"].strip(),
        "session_date": payload["session_date"].strip(),
        "start_time": payload["start_time"].strip(),
        "end_time": payload["end_time"].strip(),
        "trainer_name": payload["trainer_name"].strip(),
        "classroom_link": payload.get("classroom_link", ""),
        "zoom_meeting_id": payload.get("zoom_meeting_id"),
        "zoom_join_url": payload.get("zoom_join_url"),
        "zoom_start_url": payload.get("zoom_start_url"),
        "attendance_mode": payload.get("attendance_mode", "manual"),
        "created_at": current,
        "updated_at": current,
    }
    state["sessions"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def update_session(db: Session, tenant_name: str, session_id: str, patch: dict) -> Optional[dict]:
    state = get_tenant_state(db, tenant_name)
    for index, item in enumerate(state["sessions"]):
        if item["id"] == session_id:
            state["sessions"][index] = {
                **item,
                **patch,
                "updated_at": now_iso(),
            }
            save_tenant_state(db, tenant_name, state)
            return state["sessions"][index]
    return None


def find_session_by_zoom_meeting_id(db: Session, tenant_name: str, zoom_meeting_id: str) -> Optional[dict]:
    return next((item for item in list_items(db, tenant_name, "sessions") if item.get("zoom_meeting_id") == zoom_meeting_id), None)


def list_attendance(db: Session, tenant_name: str, session_id: str) -> list[dict]:
    items = list_items(db, tenant_name, "attendance")
    return sorted([item for item in items if item["session_id"] == session_id], key=lambda item: item.get("student_name", ""))


def assign_first_batch_if_needed(db: Session, tenant_name: str, application_id: str) -> Optional[dict]:
    application = get_application(db, tenant_name, application_id)
    if not application or application.get("batch_id"):
        return application
    batches = list_batches(db, tenant_name)
    if not batches:
        return application
    return update_application(db, tenant_name, application_id, {"batch_id": batches[0]["id"]})


def mark_attendance(db: Session, tenant_name: str, payload: dict) -> Optional[dict]:
    state = get_tenant_state(db, tenant_name)
    application = next((item for item in state["applications"] if item["id"] == payload["application_id"]), None)
    if application is None:
        return None
    current = now_iso()
    record = {
        "id": make_id("att"),
        "tenant_name": tenant_name,
        "session_id": payload["session_id"],
        "application_id": application["id"],
        "student_name": application["student_name"],
        "student_email": application["student_email"],
        "status": payload["status"],
        "marked_by": payload.get("marked_by", "trainer"),
        "join_source": payload.get("join_source", "manual"),
        "join_time": payload.get("join_time"),
        "note": payload.get("note", ""),
        "created_at": current,
        "updated_at": current,
    }
    existing_index = next(
        (index for index, item in enumerate(state["attendance"]) if item["session_id"] == payload["session_id"] and item["application_id"] == application["id"]),
        -1,
    )
    if existing_index >= 0:
        record["id"] = state["attendance"][existing_index]["id"]
        record["created_at"] = state["attendance"][existing_index]["created_at"]
        state["attendance"][existing_index] = record
    else:
        state["attendance"].append(record)

    present_count = len(
        [
            item
            for item in state["attendance"]
            if item["application_id"] == application["id"] and item["status"] in {"present", "late", "auto-present"}
        ]
    )
    for index, item in enumerate(state["applications"]):
        if item["id"] == application["id"]:
            state["applications"][index] = {
                **item,
                "attendance_completed": present_count,
                "updated_at": current,
            }
            break

    save_tenant_state(db, tenant_name, state)
    return record


def list_chapter_submissions(
    db: Session,
    tenant_name: str,
    application_id: Optional[str] = None,
    module_id: Optional[str] = None,
) -> list[dict]:
    items = list_items(db, tenant_name, "chapter_submissions")
    filtered = [
        item
        for item in items
        if (not application_id or item.get("application_id") == application_id)
        and (not module_id or item.get("module_id") == module_id)
    ]
    return sorted(filtered, key=lambda item: item.get("submitted_at", item.get("updated_at", "")), reverse=True)


def get_submission(db: Session, tenant_name: str, submission_id: str) -> Optional[dict]:
    return next((item for item in list_items(db, tenant_name, "chapter_submissions") if item.get("id") == submission_id), None)


def _progress_for_application(state: dict, application_id: str, course_id: str) -> Optional[dict]:
    return next(
        (
            item
            for item in state.get("learner_progress", [])
            if item.get("application_id") == application_id and item.get("course_id") == course_id
        ),
        None,
    )


def ensure_learner_progress(db: Session, tenant_name: str, application_id: str, course_id: str) -> dict:
    state = get_tenant_state(db, tenant_name)
    application = _find_by_id(state["applications"], application_id)
    if application is None:
        raise ValueError("Application not found")
    existing = _progress_for_application(state, application_id, course_id)
    if existing is not None:
        return existing
    current = now_iso()
    modules = list_course_modules(db, tenant_name, course_id)
    record = {
        "id": make_id("progress"),
        "tenant_name": tenant_name,
        "application_id": application_id,
        "course_id": course_id,
        "batch_id": application.get("batch_id"),
        "current_week": 1,
        "current_module_id": modules[0]["id"] if modules else None,
        "status": "active",
        "module_status": "not_started",
        "chapter_status": "not_started",
        "completed_chapter_ids": [],
        "submitted_chapter_ids": [],
        "reviewed_submission_ids": [],
        "unlock_override": False,
        "last_unlocked_at": current,
        "last_activity_at": current,
        "penalty_status": "clear",
        "penalty_fee_amount": 0,
        "penalty_fee_currency": "INR",
        "penalty_paid_at": None,
        "note": "",
        "created_at": current,
        "updated_at": current,
    }
    state["learner_progress"].append(record)
    save_tenant_state(db, tenant_name, state)
    return record


def update_learner_progress(db: Session, tenant_name: str, application_id: str, course_id: str, patch: dict) -> Optional[dict]:
    state = get_tenant_state(db, tenant_name)
    for index, item in enumerate(state["learner_progress"]):
        if item.get("application_id") == application_id and item.get("course_id") == course_id:
            next_item = {
                **item,
                **patch,
                "last_activity_at": now_iso(),
                "updated_at": now_iso(),
            }
            state["learner_progress"][index] = next_item
            save_tenant_state(db, tenant_name, state)
            return next_item
    return None


def create_chapter_submission(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    application = _find_by_id(state["applications"], payload["application_id"])
    if application is None:
        raise ValueError("Application not found")
    chapter = _find_by_id(state["course_chapters"], payload["chapter_id"])
    if chapter is None:
        raise ValueError("Chapter not found")
    ensure_learner_progress(db, tenant_name, payload["application_id"], payload["course_id"])
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    record = {
        "id": make_id("sub"),
        "tenant_name": tenant_name,
        "application_id": payload["application_id"],
        "course_id": payload["course_id"],
        "module_id": payload["module_id"],
        "chapter_id": payload["chapter_id"],
        "answer_text": payload.get("answer_text", "").strip(),
        "answer_url": payload.get("answer_url"),
        "submission_kind": payload.get("submission_kind", "text"),
        "status": "submitted",
        "submitted_at": current,
        "created_at": current,
        "updated_at": current,
    }
    state["chapter_submissions"].append(record)
    progress = _progress_for_application(state, payload["application_id"], payload["course_id"])
    if progress is not None:
        submitted_ids = list(dict.fromkeys([*progress.get("submitted_chapter_ids", []), payload["chapter_id"]]))
        for index, item in enumerate(state["learner_progress"]):
            if item["id"] == progress["id"]:
                state["learner_progress"][index] = {
                    **item,
                    "current_module_id": payload["module_id"],
                    "chapter_status": "submitted",
                    "module_status": "in_review",
                    "submitted_chapter_ids": submitted_ids,
                    "last_activity_at": current,
                    "updated_at": current,
                }
                break
    save_tenant_state(db, tenant_name, state)
    return record


def list_trainer_reviews(
    db: Session,
    tenant_name: str,
    application_id: Optional[str] = None,
    module_id: Optional[str] = None,
) -> list[dict]:
    items = list_items(db, tenant_name, "trainer_reviews")
    filtered = [
        item
        for item in items
        if (not application_id or item.get("application_id") == application_id)
        and (not module_id or item.get("module_id") == module_id)
    ]
    return sorted(filtered, key=lambda item: item.get("reviewed_at", item.get("updated_at", "")), reverse=True)


def create_trainer_review(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    submission = _find_by_id(state["chapter_submissions"], payload["submission_id"])
    if submission is None:
        raise ValueError("Submission not found")
    current = now_iso()
    record = {
        "id": make_id("review"),
        "tenant_name": tenant_name,
        "submission_id": submission["id"],
        "application_id": submission["application_id"],
        "course_id": submission["course_id"],
        "module_id": submission["module_id"],
        "chapter_id": submission["chapter_id"],
        "reviewer_name": payload["reviewer_name"].strip(),
        "outcome": payload["outcome"].strip(),
        "score": payload.get("score"),
        "ai_feedback": payload.get("ai_feedback", "").strip(),
        "trainer_feedback": payload.get("trainer_feedback", "").strip(),
        "unlock_next_module": bool(payload.get("unlock_next_module", False)),
        "reviewed_at": current,
        "created_at": current,
        "updated_at": current,
    }
    state["trainer_reviews"].append(record)
    for index, item in enumerate(state["chapter_submissions"]):
        if item["id"] == submission["id"]:
            state["chapter_submissions"][index] = {
                **item,
                "status": "reviewed" if record["outcome"] in {"pass", "resubmit", "fail"} else item.get("status", "submitted"),
                "updated_at": current,
            }
            break
    progress = _progress_for_application(state, submission["application_id"], submission["course_id"])
    if progress is not None:
        reviewed_ids = list(dict.fromkeys([*progress.get("reviewed_submission_ids", []), submission["id"]]))
        completed_ids = progress.get("completed_chapter_ids", [])
        if record["outcome"] == "pass":
            completed_ids = list(dict.fromkeys([*completed_ids, submission["chapter_id"]]))
        next_status = "in_review"
        module_status = progress.get("module_status", "in_progress")
        if record["outcome"] == "pass":
            module_status = "completed" if record["unlock_next_module"] else "in_progress"
            next_status = "evaluated"
        elif record["outcome"] == "resubmit":
            module_status = "resubmission_required"
            next_status = "resubmission_required"
        elif record["outcome"] == "fail":
            module_status = "failed"
            next_status = "failed"
        for index, item in enumerate(state["learner_progress"]):
            if item["id"] == progress["id"]:
                next_week = item.get("current_week", 1)
                next_module_id = item.get("current_module_id")
                if record["unlock_next_module"] and record["outcome"] == "pass":
                    modules = list_course_modules(db, tenant_name, submission["course_id"])
                    next_module = next((module for module in modules if int(module.get("week_number", 0)) == int(item.get("current_week", 1)) + 1), None)
                    next_week = int(item.get("current_week", 1)) + 1 if next_module else item.get("current_week", 1)
                    next_module_id = next_module["id"] if next_module else next_module_id
                state["learner_progress"][index] = {
                    **item,
                    "current_week": next_week,
                    "current_module_id": next_module_id,
                    "chapter_status": next_status,
                    "module_status": module_status,
                    "reviewed_submission_ids": reviewed_ids,
                    "completed_chapter_ids": completed_ids,
                    "status": "active" if record["outcome"] != "fail" else "at_risk",
                    "last_activity_at": current,
                    "updated_at": current,
                }
                break
    save_tenant_state(db, tenant_name, state)
    return record


def get_course_outline(db: Session, tenant_name: str, course_id: str, application_id: Optional[str] = None) -> Optional[dict]:
    state = get_tenant_state(db, tenant_name)
    course = _find_by_id(state["courses"], course_id)
    if course is None:
        return None
    application = _find_by_id(state["applications"], application_id) if application_id else None
    batch = _find_by_id(state["batches"], application.get("batch_id")) if application else None
    progress = _progress_for_application(state, application_id, course_id) if application_id else None
    submissions = list_chapter_submissions(db, tenant_name, application_id=application_id)
    reviews = list_trainer_reviews(db, tenant_name, application_id=application_id)
    modules = []
    for module in list_course_modules(db, tenant_name, course_id):
        unlock = _module_unlock_snapshot(course, module, batch, progress)
        chapters = []
        for chapter in list_course_chapters(db, tenant_name, module["id"]):
            chapter_submission = next((item for item in submissions if item.get("chapter_id") == chapter["id"]), None)
            chapter_review = next((item for item in reviews if item.get("chapter_id") == chapter["id"]), None)
            chapter_status = "not_started"
            if chapter["id"] in (progress or {}).get("completed_chapter_ids", []):
                chapter_status = "completed"
            elif chapter_review and chapter_review.get("outcome") == "resubmit":
                chapter_status = "resubmission_required"
            elif chapter_submission:
                chapter_status = chapter_submission.get("status", "submitted")
            chapters.append(
                {
                    **chapter,
                    "status": chapter_status,
                    "submission": chapter_submission,
                    "review": chapter_review,
                }
            )
        completed_count = len([item for item in chapters if item.get("status") == "completed"])
        modules.append(
            {
                **module,
                **unlock,
                "status": "completed" if chapters and completed_count == len(chapters) else ("locked" if unlock["is_relocked"] else "in_progress" if unlock["is_unlocked"] else "pending"),
                "chapters_completed": completed_count,
                "chapters_total": len(chapters),
                "chapters": chapters,
            }
        )
    return {
        "course": course,
        "modules": modules,
        "progress": progress,
    }


def get_student_lms_overview(db: Session, tenant_name: str, application_id: str) -> Optional[dict]:
    state = get_tenant_state(db, tenant_name)
    application = _find_by_id(state["applications"], application_id)
    if application is None:
        return None
    course = _course_for_application(state, application)
    if course is None:
        return None
    progress = ensure_learner_progress(db, tenant_name, application_id, course["id"])
    outline = get_course_outline(db, tenant_name, course["id"], application_id)
    submissions = list_chapter_submissions(db, tenant_name, application_id=application_id)
    reviews = list_trainer_reviews(db, tenant_name, application_id=application_id)
    modules = outline["modules"] if outline else []
    chapters_total = sum(module.get("chapters_total", 0) for module in modules)
    chapters_completed = sum(module.get("chapters_completed", 0) for module in modules)
    current_module = next((item for item in modules if item.get("id") == progress.get("current_module_id")), modules[0] if modules else None)
    return {
        "course": course,
        "progress": {
            **progress,
            "completion_percent": round((chapters_completed / max(chapters_total, 1)) * 100),
            "chapters_completed": chapters_completed,
            "chapters_total": chapters_total,
            "current_module": current_module,
            "penalty_ready": bool(current_module and current_module.get("penalty_ready")),
        },
        "modules": modules,
        "submissions": submissions,
        "reviews": reviews,
    }


def get_trainer_review_queue(db: Session, tenant_name: str) -> list[dict]:
    state = get_tenant_state(db, tenant_name)
    submissions = [item for item in list_items(db, tenant_name, "chapter_submissions") if item.get("status") != "reviewed"]
    applications = {item["id"]: item for item in state.get("applications", [])}
    chapters = {item["id"]: item for item in state.get("course_chapters", [])}
    modules = {item["id"]: item for item in state.get("course_modules", [])}
    queue = []
    for submission in submissions:
        application = applications.get(submission.get("application_id"))
        chapter = chapters.get(submission.get("chapter_id"))
        module = modules.get(submission.get("module_id"))
        queue.append(
            {
                "submission_id": submission["id"],
                "submitted_at": submission.get("submitted_at"),
                "status": submission.get("status", "submitted"),
                "student_name": (application or {}).get("student_name"),
                "student_email": (application or {}).get("student_email"),
                "course_name": (application or {}).get("course_name"),
                "module_title": (module or {}).get("title"),
                "chapter_title": (chapter or {}).get("title"),
                "application_id": submission.get("application_id"),
                "module_id": submission.get("module_id"),
                "chapter_id": submission.get("chapter_id"),
            }
        )
    return sorted(queue, key=lambda item: item.get("submitted_at", ""), reverse=True)


def list_message_events(db: Session, tenant_name: str) -> list[dict]:
    items = list_items(db, tenant_name, "message_events")
    return sorted(items, key=lambda item: item.get("created_at", ""), reverse=True)


def create_message_event(db: Session, tenant_name: str, payload: dict) -> dict:
    state = get_tenant_state(db, tenant_name)
    current = now_iso()
    record = {
        "id": make_id("msg"),
        "tenant_name": tenant_name,
        "message_id": payload.get("message_id"),
        "channel": payload.get("channel", "email"),
        "audience": payload.get("audience", ""),
        "purpose": payload.get("purpose", ""),
        "template": payload.get("template", ""),
        "status": payload.get("status", "sent"),
        "note": payload.get("note", ""),
        "created_at": current,
        "updated_at": current,
    }
    state.setdefault("message_events", []).append(record)
    save_tenant_state(db, tenant_name, state)
    return record


# ----- Webhook idempotency (§17.2 C2) ----------------------------------------

def was_webhook_event_processed(db: Session, event_id: str, *, source: str = "razorpay") -> bool:
    """Return True if this (source, event_id) pair has already been processed.

    Use at the top of every inbound webhook handler to short-circuit duplicate
    deliveries (Razorpay retries on its own schedule; Zoom does too).
    """
    if not event_id:
        return False
    record = (
        db.query(AcademyWebhookEvent)
        .filter(
            AcademyWebhookEvent.source == source,
            AcademyWebhookEvent.event_id == event_id,
        )
        .first()
    )
    return record is not None


def record_webhook_event(
    db: Session,
    event_id: str,
    *,
    source: str = "razorpay",
    reference: str = "",
) -> Optional[AcademyWebhookEvent]:
    """Persist a processed webhook event so future replays are short-circuited.

    Idempotent: if the same (source, event_id) is recorded twice, the second
    call returns the existing row instead of raising. Don't fail the webhook
    if the recording fails — the side effects already happened.
    """
    if not event_id:
        return None
    existing = (
        db.query(AcademyWebhookEvent)
        .filter(
            AcademyWebhookEvent.source == source,
            AcademyWebhookEvent.event_id == event_id,
        )
        .first()
    )
    if existing is not None:
        return existing
    record = AcademyWebhookEvent(
        source=source,
        event_id=event_id,
        reference=reference or None,
        processed_at=now_iso(),
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        # Race condition: another concurrent webhook recorded it just now.
        return (
            db.query(AcademyWebhookEvent)
            .filter(
                AcademyWebhookEvent.source == source,
                AcademyWebhookEvent.event_id == event_id,
            )
            .first()
        )
    return record
