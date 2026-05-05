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
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.integrations import (
    render_module_unlocked_email,
    render_recording_overdue_email,
    send_email,
)
from app.store import (
    find_session_by_id,
    find_user_by_full_name,
    get_course_outline,
    get_tenant_state,
    list_applications,
    list_attendance_for_session,
    list_batches,
    list_courses,
    list_email_outbox,
    list_session_resources,
    list_sessions,
    mark_attendance,
    record_event,
    save_tenant_state,
    update_email_outbox_entry,
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

    # §13.3 events timeline — log this run so ops can see at a glance
    # how many emails went out and whether anything looked weird.
    try:
        record_event(
            db,
            tenant_name,
            event_type="cron.unlock_modules",
            actor="cron:unlock-modules",
            target_id=None,
            payload={
                "sent": sent,
                "skipped": skipped_already_notified,
                "no_batch": no_batch,
                "ran_at": today,
            },
        )
    except Exception as evt_err:  # noqa: BLE001
        logger.warning("record_event(cron.unlock_modules) failed err=%s", evt_err)

    return {
        "ok": True,
        "tenant": tenant_name,
        "ran_at": today,
        "emails_sent": sent,
        "skipped_already_notified": skipped_already_notified,
        "applications_without_batch": no_batch,
    }


def _parse_session_window(session_row: dict) -> tuple[Optional[datetime], Optional[datetime]]:
    """Combine `session_date` (YYYY-MM-DD) with `start_time` / `end_time`
    (HH:MM) and return UTC-aware datetimes. We treat the stored time as
    UTC for cron arithmetic — the platform runs IST sessions but the row
    times are inserted as the trainer typed them. Close enough for a
    'has-the-window-ended' check; the +15 min grace absorbs slop."""
    session_date = (session_row.get("session_date") or "").strip()
    start_time = (session_row.get("start_time") or "").strip()
    end_time = (session_row.get("end_time") or "").strip()
    if not session_date:
        return None, None
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    try:
        if start_time:
            start_dt = datetime.fromisoformat(f"{session_date}T{start_time}").replace(tzinfo=timezone.utc)
    except ValueError:
        start_dt = None
    try:
        if end_time:
            end_dt = datetime.fromisoformat(f"{session_date}T{end_time}").replace(tzinfo=timezone.utc)
    except ValueError:
        end_dt = None
    return start_dt, end_dt


def _course_for_session(session_row: dict, courses: list[dict], batches: list[dict]) -> Optional[dict]:
    """Resolve a session → course via batch.course_name. Returns None if
    the batch's course can't be matched to any course row."""
    batch = next((b for b in batches if b.get("id") == session_row.get("batch_id")), None)
    if not batch:
        return None
    target = (batch.get("course_name") or "").strip().lower()
    if not target:
        return None
    return next(
        (c for c in courses if (c.get("title") or "").strip().lower() == target),
        None,
    )


@router.post("/attendance-finalize")
def cron_attendance_finalize(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    For each session whose `end_time + 15 min` has passed (and whose
    session_date is today or yesterday — don't backfill ancient cohorts):
      1. Insert `status='absent'` rows for every enrolled student on the
         batch who has no attendance row yet.
      2. Downgrade `present` rows whose `join_time > start_time + late_threshold`
         to `late`. Threshold reads from course.late_threshold_minutes,
         defaulting to 15.

    Run hourly.
    """
    _require_cron_secret(authorization)
    tenant_name = settings.tenant_name
    now_utc = datetime.now(timezone.utc)
    today = now_utc.date()
    yesterday = today - timedelta(days=1)

    sessions = list_sessions(db, tenant_name)
    applications = list_applications(db, tenant_name)
    batches = list_batches(db, tenant_name)
    courses = list_courses(db, tenant_name)

    sessions_finalized = 0
    absent_marked = 0
    late_downgraded = 0

    state = get_tenant_state(db, tenant_name)

    for session_row in sessions:
        # Date guardrail — only finalize today/yesterday.
        session_date_str = (session_row.get("session_date") or "").strip()
        try:
            session_date = datetime.fromisoformat(session_date_str).date()
        except ValueError:
            continue
        if session_date not in {today, yesterday}:
            continue

        start_dt, end_dt = _parse_session_window(session_row)
        if end_dt is None:
            continue
        if now_utc < end_dt + timedelta(minutes=15):
            continue

        course = _course_for_session(session_row, courses, batches)
        late_threshold = int(((course or {}).get("late_threshold_minutes")) or 15)

        existing = list_attendance_for_session(db, tenant_name, session_row["id"])
        existing_by_app = {row.get("application_id"): row for row in existing}

        # 1. Mark absent for every enrolled student missing a row.
        enrolled = [
            app for app in applications
            if app.get("batch_id") == session_row.get("batch_id")
            and app.get("application_stage") in {"enrolled", "active", "in_progress"}
        ]
        any_change = False
        for app in enrolled:
            if app["id"] in existing_by_app:
                continue
            try:
                mark_attendance(
                    db,
                    tenant_name,
                    {
                        "session_id": session_row["id"],
                        "application_id": app["id"],
                        "status": "absent",
                        "marked_by": "system",
                        "join_source": "auto-finalize",
                        "note": "Auto-marked absent by attendance-finalize cron.",
                    },
                )
                absent_marked += 1
                any_change = True
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "absent-mark failed session=%s app=%s err=%s",
                    session_row.get("id"), app.get("id"), exc,
                )

        # 2. Downgrade `present` → `late` when join_time exceeds the threshold.
        if start_dt is not None:
            late_cutoff = start_dt + timedelta(minutes=late_threshold)
            # Re-read state to mutate attendance rows in place.
            state = get_tenant_state(db, tenant_name)
            mutated = False
            for idx, row in enumerate(state.get("attendance", [])):
                if row.get("session_id") != session_row["id"]:
                    continue
                if row.get("status") != "present":
                    continue
                join_time_str = row.get("join_time")
                if not join_time_str:
                    continue
                try:
                    join_dt = datetime.fromisoformat(str(join_time_str).replace("Z", "+00:00"))
                    if join_dt.tzinfo is None:
                        join_dt = join_dt.replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
                if join_dt > late_cutoff:
                    state["attendance"][idx] = {
                        **row,
                        "status": "late",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                    late_downgraded += 1
                    mutated = True
            if mutated:
                save_tenant_state(db, tenant_name, state)
                any_change = True

        if any_change:
            sessions_finalized += 1

    return {
        "ok": True,
        "sessions_finalized": sessions_finalized,
        "absent_marked": absent_marked,
        "late_downgraded": late_downgraded,
    }


@router.post("/recording-deadline")
def cron_recording_deadline(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    For every session that ended >48h ago (and <14 days ago — don't go
    backfill ancient cohorts) AND has no session_resources row of
    kind='recording', email the trainer a reminder.

    §4.2 trainer-as-user: once `session.trainer_id` is populated, we
    look up the auth user, render `render_recording_overdue_email`, and
    send it to their email. Sessions still missing trainer_id (legacy
    rows that haven't been back-filled) fall through to the old log-only
    behaviour so ops still get visibility.

    Run daily at 07:00 IST.
    """
    _require_cron_secret(authorization)
    tenant_name = settings.tenant_name
    now_utc = datetime.now(timezone.utc)

    sessions = list_sessions(db, tenant_name)
    overdue = 0
    emailed = 0
    no_trainer = 0

    for session_row in sessions:
        _, end_dt = _parse_session_window(session_row)
        if end_dt is None:
            continue
        age = now_utc - end_dt
        if age < timedelta(hours=48):
            continue
        if age > timedelta(days=14):
            continue
        recordings = [
            r for r in list_session_resources(db, tenant_name, session_id=session_row["id"])
            if r.get("kind") == "recording"
        ]
        if recordings:
            continue
        overdue += 1
        hours_overdue = int(age.total_seconds() // 3600)

        trainer_id = (session_row.get("trainer_id") or "").strip()
        trainer_email: Optional[str] = None
        trainer_full_name = session_row.get("trainer_name") or ""

        if trainer_id:
            # Today trainer_id == trainer's auth email. Use it directly.
            trainer_email = trainer_id
        else:
            # Fallback: try resolving via trainer_name → user lookup. If
            # back-fill hasn't been run yet this catches the easy cases.
            user = find_user_by_full_name(db, tenant_name, trainer_full_name)
            if user is not None:
                trainer_email = user.get("email")
                trainer_full_name = user.get("full_name") or trainer_full_name

        if not trainer_email:
            no_trainer += 1
            logger.warning(
                "recording-overdue (no trainer email) tenant=%s session=%s title=%r trainer=%r ended=%s",
                tenant_name,
                session_row.get("id"),
                session_row.get("title"),
                session_row.get("trainer_name"),
                end_dt.isoformat(),
            )
            continue

        try:
            meta = render_recording_overdue_email(
                trainer_name=trainer_full_name or "trainer",
                session_title=session_row.get("title") or "Live class",
                session_date=session_row.get("session_date") or "",
                hours_overdue=hours_overdue,
            )
            send_email(
                to=trainer_email,
                subject=meta["subject"],
                html=meta["html"],
                text=meta["text"],
                db=db,
                tenant_name=tenant_name,
            )
            emailed += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "recording-overdue email failed session=%s err=%s",
                session_row.get("id"), exc,
            )

    return {
        "ok": True,
        "sessions_overdue": overdue,
        "emails_sent": emailed,
        "missing_trainer": no_trainer,
    }


# -------------------------------------------------------------------
# §13.1 email retry queue worker.
# Hobby plan caps cron at 1/day so this fires once daily at 07:30 IST.
# Picks up entries that send_email() previously enqueued onto
# tenant_state['email_outbox'] with status='pending' and retries them
# via Resend. After 3 attempts an entry flips to 'gave_up'.
# -------------------------------------------------------------------


@router.post("/email-retry")
def cron_email_retry(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    _require_cron_secret(authorization)
    tenant_name = settings.tenant_name

    pending = list_email_outbox(db, tenant_name, status="pending")
    retried = 0
    succeeded = 0
    gave_up = 0

    for entry in pending:
        attempts = int(entry.get("attempts", 0) or 0)
        if attempts >= 3:
            # Defensive: list_email_outbox(status='pending') already
            # excludes 'gave_up', but if a row's status got out of sync
            # (manual edit, partial write) push it back to gave_up.
            update_email_outbox_entry(
                db, tenant_name, entry["id"],
                {"status": "gave_up"},
            )
            gave_up += 1
            continue

        retried += 1
        attempt_ts = datetime.now(timezone.utc).isoformat()

        # IMPORTANT: pass enqueue_on_failure=False to the retry call so
        # we don't infinitely re-queue ourselves. We update the existing
        # row in-place instead.
        send_kwargs = {
            "to": entry.get("to") or "",
            "subject": entry.get("subject") or "",
            "html": entry.get("html") or "",
            "text": entry.get("text"),
            "reply_to": entry.get("reply_to"),
            "enqueue_on_failure": False,
        }
        # Only forward `from_address` when the queued entry stored a
        # custom value — otherwise let send_email apply DEFAULT_EMAIL_FROM.
        if entry.get("from_address"):
            send_kwargs["from_address"] = entry["from_address"]
        result = send_email(**send_kwargs)

        mode = (result or {}).get("mode")
        next_attempts = attempts + 1
        if mode == "live" or mode == "mock":
            # Mock mode counts as a success — the retry queue exists for
            # delivery failures, not for environments where Resend is off.
            update_email_outbox_entry(
                db, tenant_name, entry["id"],
                {
                    "status": "sent",
                    "attempts": next_attempts,
                    "last_attempt_at": attempt_ts,
                    "last_error": "",
                },
            )
            succeeded += 1
        else:
            # Failure path: increment attempts, write last_error. If
            # we've now hit the cap, flip to 'gave_up' so we don't keep
            # retrying forever.
            patch = {
                "attempts": next_attempts,
                "last_attempt_at": attempt_ts,
                "last_error": (result or {}).get("detail", "send failed"),
            }
            if next_attempts >= 3:
                patch["status"] = "gave_up"
                gave_up += 1
            update_email_outbox_entry(db, tenant_name, entry["id"], patch)

    # §13.3 events timeline.
    try:
        record_event(
            db,
            tenant_name,
            event_type="cron.email_retry",
            actor="cron:email-retry",
            target_id=None,
            payload={
                "retried": retried,
                "succeeded": succeeded,
                "gave_up": gave_up,
            },
        )
    except Exception as evt_err:  # noqa: BLE001
        logger.warning("record_event(cron.email_retry) failed err=%s", evt_err)

    return {
        "ok": True,
        "retried": retried,
        "succeeded": succeeded,
        "gave_up": gave_up,
    }
