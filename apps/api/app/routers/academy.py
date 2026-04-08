from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.auth import auth_dependency, login_user
from app.db import get_db
from app.integrations import create_payment_link, provision_zoom_meeting
from app.schemas import (
    ApplicationAttendanceUpdate,
    ApplicationCreate,
    ApplicationStatusUpdate,
    BatchCreate,
    LoginRequest,
    PaymentLinkUpdate,
    SessionAttendanceUpdate,
    SessionCreate,
    SessionZoomUpdate,
    TenantBranding,
    ZoomProvisionRequest,
    ZoomWebhookAttendance,
)
from app.store import (
    assign_first_batch_if_needed,
    create_application,
    create_batch,
    create_message_event,
    create_session,
    find_application_by_email,
    find_application_by_reference,
    find_session_by_zoom_meeting_id,
    find_tenant_by_domain,
    get_application,
    get_session,
    get_tenant_state,
    list_applications,
    list_attendance,
    list_batches,
    list_message_events,
    list_sessions,
    mark_attendance,
    save_tenant_state,
    update_application,
    update_branding,
    update_session,
)

router = APIRouter()

READ_ROLES = {"admin", "operations", "trainer"}
WRITE_ROLES = {"admin", "operations"}
TRAINER_ROLES = {"admin", "operations", "trainer"}


@router.post("/auth/login")
def academy_login(payload: LoginRequest, db: Session = Depends(get_db)):
    return {
        "ok": True,
        "session": login_user(db, payload.tenant_name, payload.email, payload.password),
    }


@router.get("/auth/me")
def academy_me(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    return {
        "ok": True,
        "session": auth_dependency(db, tenant_name, x_academy_session, None),
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
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, {"admin"})
    item = update_branding(db, payload.tenant_name, payload.model_dump())
    return {
        "ok": True,
        "item": item,
    }


@router.get("/applications")
def read_applications(tenant_name: str, db: Session = Depends(get_db)):
    # dashboard data should be staff-only
    return {"items": list_applications(db, tenant_name)}


@router.get("/applications/secure")
def read_applications_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, READ_ROLES)
    return {"items": list_applications(db, tenant_name)}


@router.get("/applications/{application_id}")
def read_application(application_id: str, tenant_name: str, db: Session = Depends(get_db)):
    item = get_application(db, tenant_name, application_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Application not found")
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
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, WRITE_ROLES)
    patch = payload.model_dump(exclude_none=True)
    patch.pop("tenant_name", None)
    item = update_application(db, payload.tenant_name, application_id, patch)
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
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, TRAINER_ROLES)
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
    payment = create_payment_link(
        application_id=application_id,
        amount_due=payload.amount_due if payload.amount_due is not None else float(application.get("amount_due", 0)),
        currency=payload.currency or application.get("currency", "INR"),
    )
    item = update_application(
        db,
        payload.tenant_name,
        application_id,
        {
            "amount_due": payment["amount_due"],
            "currency": payment["currency"],
            "payment_order_id": payment["order_id"],
            "payment_reference": payment["payment_reference"],
            "payment_url": payment["payment_url"],
            "application_stage": payload.application_stage or "payment_pending",
            "payment_stage": payload.payment_stage or "order_created",
        },
    )
    return {
        "ok": True,
        "item": item,
        "payment": payment,
    }


@router.post("/payments/webhook/razorpay/{reference}")
def capture_payment(reference: str, db: Session = Depends(get_db)):
    application = find_application_by_reference(db, reference)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    item = update_application(
        db,
        application["tenant_name"],
        application["id"],
        {
            "application_stage": "enrolled",
            "payment_stage": "paid",
            "enrollment_stage": "active",
        },
    )
    item = assign_first_batch_if_needed(db, application["tenant_name"], application["id"]) or item
    return {"ok": True, "item": item}


@router.get("/students/me")
def read_student_me(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    session = auth_dependency(db, tenant_name, x_academy_session, {"student"})
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
    }


@router.get("/batches")
def read_batches(tenant_name: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/batches/secure")
def read_batches_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, READ_ROLES)
    return {"items": list_batches(db, tenant_name)}


@router.post("/batches")
def create_batch_route(payload: BatchCreate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/batches/secure")
def create_batch_route_secure(
    payload: BatchCreate,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, WRITE_ROLES)
    return {"ok": True, "item": create_batch(db, payload.tenant_name, payload.model_dump())}


@router.get("/sessions")
def read_sessions(tenant_name: str, batch_id: Optional[str] = None, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/sessions/secure")
def read_sessions_secure(
    tenant_name: str,
    batch_id: Optional[str] = None,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, READ_ROLES)
    return {"items": list_sessions(db, tenant_name, batch_id)}


@router.post("/sessions")
def create_session_route(payload: SessionCreate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/sessions/secure")
def create_session_route_secure(
    payload: SessionCreate,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, WRITE_ROLES)
    return {"ok": True, "item": create_session(db, payload.tenant_name, payload.model_dump())}


@router.get("/sessions/{session_id}/attendance")
def read_session_attendance(session_id: str, tenant_name: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.get("/sessions/{session_id}/attendance/secure")
def read_session_attendance_secure(
    session_id: str,
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, TRAINER_ROLES)
    return {"items": list_attendance(db, tenant_name, session_id)}


@router.post("/sessions/{session_id}/attendance")
def write_session_attendance(session_id: str, payload: SessionAttendanceUpdate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/sessions/{session_id}/attendance/secure")
def write_session_attendance_secure(
    session_id: str,
    payload: SessionAttendanceUpdate,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, TRAINER_ROLES)
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
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, TRAINER_ROLES)
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
    db: Session = Depends(get_db),
):
    auth_dependency(db, payload.tenant_name, x_academy_session, TRAINER_ROLES)
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
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, READ_ROLES)
    return get_tenant_state(db, tenant_name)


@router.post("/state/{tenant_name}")
def overwrite_full_state(tenant_name: str, payload: dict, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Secure endpoint required")


@router.post("/state/{tenant_name}/secure")
def overwrite_full_state_secure(
    tenant_name: str,
    payload: dict,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, WRITE_ROLES)
    return save_tenant_state(db, tenant_name, payload)


@router.get("/messages/secure")
def read_messages_secure(
    tenant_name: str,
    x_academy_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    auth_dependency(db, tenant_name, x_academy_session, READ_ROLES)
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
    db: Session = Depends(get_db),
):
    tenant_name = str(payload.get("tenant_name", "")).strip()
    if not tenant_name:
        raise HTTPException(status_code=400, detail="tenant_name is required")
    session = auth_dependency(db, tenant_name, x_academy_session, READ_ROLES)
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
