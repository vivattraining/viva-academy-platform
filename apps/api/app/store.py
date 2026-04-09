from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import secrets
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import AcademyTenantState


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:18]}"


def _default_branding(tenant_name: str) -> dict:
    return {
        "tenant_name": tenant_name,
        "brand_name": "VIVA Training Institute",
        "academy_name": "VIVA Career Academy",
        "custom_domain": "academy.vivatraininginstitute.com",
        "primary_color": "#0B1F3A",
        "accent_color": "#F4B400",
        "support_email": "support@vivatraininginstitute.com",
        "certificate_name": "VIVA Certified Travel Professional",
        "classroom_provider": "zoom",
        "zoom_host_email": "faculty@vivatraininginstitute.com",
        "zoom_default_timezone": "Asia/Kolkata",
    }


def default_state(tenant_name: str) -> dict:
    current = now_iso()
    batch_id = "batch_viva_01"
    demo_application_id = "acad_demo_student_01"
    return {
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
                "payment_url": "https://payments.vivatraininginstitute.com/demo/order_demo_student_01",
                "payment_reference": "payref_demo_student_01",
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
                "name": "VIVA Batch 01",
                "course_name": "Travel Professional Certification",
                "start_date": "2026-05-04",
                "trainer_name": "Vikas Khanduri",
                "classroom_mode": "hybrid",
                "classroom_link": "https://academy.vivatraininginstitute.com/classrooms/batch-01",
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
                "classroom_link": "https://academy.vivatraininginstitute.com/classrooms/batch-01",
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
                "classroom_link": "https://academy.vivatraininginstitute.com/classrooms/batch-01",
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
    return deepcopy(record.state or default_state(tenant_name))


def save_tenant_state(db: Session, tenant_name: str, state: dict) -> dict:
    record = db.query(AcademyTenantState).filter(AcademyTenantState.tenant_name == tenant_name).first()
    next_state = deepcopy(state)
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
