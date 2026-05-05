"""
Time-based cron endpoints.

Vercel Cron (configured in `vercel.json`) hits these on a schedule. Every
endpoint requires the shared `CRON_SECRET` in the Authorization header — both
to keep the surface non-public and to make sure only Vercel's scheduler can
trigger them.

Endpoints:
  POST /api/v1/cron/unlock-modules     daily 06:00 IST → emails students whose
                                        modules unlock today.
  POST /api/v1/cron/attendance-finalize hourly → flips no-show enrolments to
                                        `absent` after a session's window.
                                        (Stub for Phase A; expanded in Phase B.)
  POST /api/v1/cron/recording-deadline  daily → reminds trainer when a
                                        session's recording is missing 48h
                                        post-session. (Stub for Phase A.)

Idempotency:
  - `unlock-modules` writes `module_unlock_notified_at[module_id]` onto the
    learner's progress record. A second run on the same day is a no-op.
  - The other two are stubs — they return early with `skipped=true`.
"""

from __future__ import annotations

import hmac
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.integrations import render_module_unlocked_email, send_email
from app.store import (
    get_course_outline,
    get_tenant_state,
    list_applications,
    list_batches,
    save_tenant_state,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _require_cron_secret(authorization: Optional[str]) -> None:
    """
    Authenticate the caller using the shared CRON_SECRET.

    Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; we accept either
    that or a bare token to keep local testing simple.
    """
    expected = (settings.cron_secret or "").strip()
    if not expected:
        if settings.app_env == "production":
            logger.error("Cron endpoint hit but CRON_SECRET is not configured")
            raise HTTPException(status_code=503, detail="Cron not configured")
        # In dev with no secret, allow through to make local testing easy.
        return
    provided = (authorization or "").strip()
    if provided.lower().startswith("bearer "):
        provided = provided.split(" ", 1)[1].strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid cron authorization")


def _today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


@router.post("/unlock-modules")
def cron_unlock_modules(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Find every module that unlocks today (per the student's batch start +
    `unlock_offset_days`) and send the `module_unlocked` email. Idempotent
    via `module_unlock_notified_at[module_id]` on each learner's progress.

    Run at 06:00 IST daily.
    """
    _require_cron_secret(authorization)

    tenant_name = settings.tenant_name
    state = get_tenant_state(db, tenant_name)
    today = _today_iso()
    today_date = datetime.now(timezone.utc).date()

    sent = 0
    skipped_already_notified = 0
    no_batch = 0
    courses_by_id = {c["id"]: c for c in state.get("courses", [])}
    batches_by_id = {b["id"]: b for b in list_batches(db, tenant_name)}

    # Walk every active enrollment.
    for application in list_applications(db, tenant_name):
        if application.get("application_stage") not in {"enrolled", "active", "in_progress"}:
            continue
        student_email = application.get("student_email")
        student_name = application.get("student_name") or "Student"
        if not student_email:
            continue

        batch = batches_by_id.get(application.get("batch_id") or "")
        if not batch or not batch.get("start_date"):
            no_batch += 1
            continue

        # Resolve the course for this application.
        course = next(
            (
                c for c in courses_by_id.values()
                if str(c.get("title", "")).strip().lower()
                == str(application.get("course_name", "")).strip().lower()
            ),
            None,
        )
        if course is None:
            continue

        outline = get_course_outline(db, tenant_name, course["id"], application["id"])
        if not outline:
            continue

        # Pull the (possibly stale) progress record so we can mark notified.
        progress = next(
            (
                p for p in state.get("learner_progress", [])
                if p.get("application_id") == application["id"]
                and p.get("course_id") == course["id"]
            ),
            None,
        )
        if progress is None:
            continue

        notified = progress.setdefault("module_unlock_notified_at", {})

        for module in outline["modules"]:
            unlock_date = module.get("unlock_date")
            if unlock_date != today:
                continue
            if notified.get(module["id"]):
                skipped_already_notified += 1
                continue

            try:
                meta = render_module_unlocked_email(
                    student_name=student_name,
                    course_title=course.get("title", ""),
                    module_title=module.get("title", ""),
                    week_number=int(module.get("week_number") or 0),
                    unlock_date=today,
                    application_id=application["id"],
                )
                send_email(
                    to=student_email,
                    subject=meta["subject"],
                    html=meta["html"],
                    text=meta["text"],
                )
                notified[module["id"]] = datetime.now(timezone.utc).isoformat()
                sent += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "module_unlocked email failed app=%s module=%s err=%s",
                    application["id"], module.get("id"), exc,
                )

        # Persist the notified-at marks back onto progress.
        progress["module_unlock_notified_at"] = notified

    save_tenant_state(db, tenant_name, state)

    return {
        "ok": True,
        "tenant": tenant_name,
        "ran_at": today,
        "emails_sent": sent,
        "skipped_already_notified": skipped_already_notified,
        "applications_without_batch": no_batch,
    }


@router.post("/attendance-finalize")
def cron_attendance_finalize(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Stub for Phase A.

    Phase B will: for each session whose `end_time + 15 min` has passed and
    whose attendance roll is incomplete, write `absent` rows for every
    enrolled student who has no attendance row yet, and downgrade
    `present → late` when join_time > start_time + late_threshold.

    Run hourly.
    """
    _require_cron_secret(authorization)
    return {"ok": True, "skipped": True, "reason": "Phase A stub — Phase B will implement"}


@router.post("/recording-deadline")
def cron_recording_deadline(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Stub for Phase A.

    Phase B will: for every session that finished >48h ago and has no
    `session_resources` row of kind=recording, email the trainer of record
    and CC ops.

    Run daily at 07:00 IST.
    """
    _require_cron_secret(authorization)
    return {"ok": True, "skipped": True, "reason": "Phase A stub — Phase B will implement"}
