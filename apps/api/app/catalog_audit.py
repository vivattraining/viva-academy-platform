"""
Catalog audit log — detects changes to the course catalog and records
them in the database for in-platform display.

Why this exists:
  course_catalog.py is the single source of truth for course data, but
  Geeta/Suhani/Vikas don't read GitHub commits. This module surfaces
  every catalog change inside the academy admin UI as a human-readable
  audit trail.

How it works:
  1. The /courses/catalog endpoint calls `detect_and_record(db)` on
     each request.
  2. We compute a SHA-256 hash of the current catalog. If it matches
     the most recent snapshot's hash, we short-circuit (cheap path).
  3. If the hashes differ, we diff field-by-field against the last
     snapshot, append one AcademyCatalogChangeEvent row per (course,
     field) change, and write a new snapshot row.
  4. Author info: Vercel injects VERCEL_GIT_COMMIT_SHA and
     VERCEL_GIT_COMMIT_MESSAGE on every deploy — we capture both.

First-deploy behavior:
  When no snapshot exists yet, we record a baseline silently (no
  change events) so the first-ever rollout doesn't flood the log
  with "course added" events.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.course_catalog import COURSE_CATALOG, Course
from app.models import AcademyCatalogChangeEvent, AcademyCatalogSnapshot

_logger = logging.getLogger(__name__)

# Fields we audit. Anything not in this list is presentation noise
# (e.g. computed display strings) and is excluded from the diff.
AUDITED_FIELDS = (
    "name",
    "fee_inr",
    "duration_label",
    "format_label",
    "cohort_label",
    "coming_soon",
    "reservation_fee_inr",
    "title_lead",
    "title_emphasis",
    "description",
)


def _course_to_dict(c: Course) -> dict[str, Any]:
    return {f: getattr(c, f) for f in AUDITED_FIELDS}


def _catalog_to_dict() -> dict[str, dict[str, Any]]:
    return {c.code: _course_to_dict(c) for c in COURSE_CATALOG}


def _hash_snapshot(snapshot: dict[str, dict[str, Any]]) -> str:
    payload = json.dumps(snapshot, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _commit_meta() -> tuple[str | None, str | None]:
    """Read commit info from Vercel's build env. Returns (sha, message)."""
    return (
        os.getenv("VERCEL_GIT_COMMIT_SHA") or None,
        os.getenv("VERCEL_GIT_COMMIT_MESSAGE") or None,
    )


def detect_and_record(db: Session) -> dict[str, Any]:
    """
    Compare the live catalog against the most recent snapshot.
    On mismatch, record events + new snapshot. Returns a small
    summary dict for callers that want telemetry.

    Safe to call on every request — short-circuits cheaply when
    the catalog hasn't changed (single-row hash compare).
    """
    current_snapshot = _catalog_to_dict()
    current_hash = _hash_snapshot(current_snapshot)

    last_row = (
        db.query(AcademyCatalogSnapshot)
        .order_by(AcademyCatalogSnapshot.id.desc())
        .first()
    )

    # First-ever run: establish baseline silently.
    if last_row is None:
        commit_sha, commit_message = _commit_meta()
        db.add(
            AcademyCatalogSnapshot(
                captured_at=_now_iso(),
                catalog_hash=current_hash,
                snapshot=current_snapshot,
                commit_sha=commit_sha,
                commit_message=commit_message,
            )
        )
        db.commit()
        _logger.info("catalog_audit: baseline snapshot captured (hash=%s)", current_hash[:12])
        return {"status": "baseline_captured", "hash": current_hash}

    # No change → done.
    if last_row.catalog_hash == current_hash:
        return {"status": "unchanged", "hash": current_hash}

    # Diff field-by-field.
    last_snapshot = last_row.snapshot or {}
    timestamp = _now_iso()
    commit_sha, commit_message = _commit_meta()
    events: list[AcademyCatalogChangeEvent] = []

    # Existing courses with field changes; new courses.
    for code, course in current_snapshot.items():
        prior = last_snapshot.get(code)
        if prior is None:
            events.append(
                AcademyCatalogChangeEvent(
                    detected_at=timestamp,
                    course_code=code,
                    field="*added*",
                    before_value=None,
                    after_value=course.get("name", code),
                    commit_sha=commit_sha,
                    commit_message=commit_message,
                )
            )
            continue
        for field in AUDITED_FIELDS:
            before = prior.get(field)
            after = course.get(field)
            if before != after:
                events.append(
                    AcademyCatalogChangeEvent(
                        detected_at=timestamp,
                        course_code=code,
                        field=field,
                        before_value=None if before is None else str(before),
                        after_value=None if after is None else str(after),
                        commit_sha=commit_sha,
                        commit_message=commit_message,
                    )
                )

    # Removed courses.
    for code in last_snapshot:
        if code not in current_snapshot:
            events.append(
                AcademyCatalogChangeEvent(
                    detected_at=timestamp,
                    course_code=code,
                    field="*removed*",
                    before_value=last_snapshot[code].get("name", code),
                    after_value=None,
                    commit_sha=commit_sha,
                    commit_message=commit_message,
                )
            )

    if not events:
        # Hash differed but no audited fields changed — likely a code
        # refactor that didn't affect course data. Still update the
        # snapshot so we don't keep re-detecting.
        db.add(
            AcademyCatalogSnapshot(
                captured_at=timestamp,
                catalog_hash=current_hash,
                snapshot=current_snapshot,
                commit_sha=commit_sha,
                commit_message=commit_message,
            )
        )
        db.commit()
        return {"status": "no_audited_changes", "hash": current_hash}

    db.bulk_save_objects(events)
    db.add(
        AcademyCatalogSnapshot(
            captured_at=timestamp,
            catalog_hash=current_hash,
            snapshot=current_snapshot,
            commit_sha=commit_sha,
            commit_message=commit_message,
        )
    )
    db.commit()
    _logger.info(
        "catalog_audit: %d change events recorded for hash=%s commit=%s",
        len(events), current_hash[:12], (commit_sha or "")[:8],
    )

    # Cohort-announce hook — for any course that flipped
    # coming_soon: True → False in this deploy, find reservation-holders
    # and trigger the balance-reminder flow. See _trigger_cohort_announce
    # for the full side-effect chain.
    for event in events:
        if event.field != "coming_soon":
            continue
        if str(event.before_value).lower() == "true" and str(event.after_value).lower() == "false":
            try:
                _trigger_cohort_announce(db, event.course_code, current_snapshot.get(event.course_code, {}))
            except Exception as announce_err:  # noqa: BLE001
                _logger.error(
                    "catalog_audit: cohort announce failed for course=%s err=%s",
                    event.course_code, announce_err,
                )

    return {"status": "changes_recorded", "events": len(events), "hash": current_hash}


def _trigger_cohort_announce(db: Session, course_code: str, course_data: dict[str, Any]) -> None:
    """When a coming-soon course is announced (coming_soon=True→False),
    find every paid reservation for that course and:
      1. Set balance_due_by = now + 14 days on the application row
      2. Send a balance-reminder email

    Failures on individual emails are logged but don't block other
    students. The DB write happens regardless (so balance_due_by is
    always correct even if Resend is down).
    """
    from datetime import datetime, timedelta, timezone
    from app.models import AcademyTenantState
    from app.integrations import render_balance_reminder_email, send_email

    cohort_label = course_data.get("cohort_label", "")
    course_name = course_data.get("name", course_code)

    # Iterate all tenants. Single-tenant today (Viva Career Academy);
    # the loop is cheap and forward-compatible with white-labeled multi-tenant.
    rows = db.query(AcademyTenantState).all()
    now = datetime.now(timezone.utc)
    due_by = (now + timedelta(days=14)).isoformat()

    notified = 0
    for row in rows:
        state = row.state or {}
        applications = state.get("applications", [])
        dirty = False
        for app in applications:
            if not app.get("is_reservation"):
                continue
            if app.get("course_code") != course_code:
                continue
            if not app.get("reservation_paid_at"):
                continue
            if app.get("balance_paid_at"):
                continue
            # Set balance_due_by (idempotent — overwrites any previous value).
            app["balance_due_by"] = due_by
            app["updated_at"] = now.isoformat()
            dirty = True
            # Send balance reminder.
            try:
                meta = render_balance_reminder_email(
                    student_name=app.get("student_name", ""),
                    course_name=course_name,
                    cohort_label=cohort_label,
                    balance_amount=float(app.get("balance_amount", 0) or 0),
                    balance_due_by=due_by,
                    application_id=app.get("id", ""),
                    currency=app.get("currency", "INR"),
                )
                send_email(
                    to=app.get("student_email", ""),
                    subject=meta["subject"],
                    html=meta["html"],
                    text=meta["text"],
                )
                notified += 1
            except Exception as email_err:  # noqa: BLE001
                _logger.warning(
                    "cohort_announce email failed for application=%s err=%s",
                    app.get("id"), email_err,
                )
        if dirty:
            row.state = state
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(row, "state")

    if notified:
        db.commit()
        _logger.info(
            "cohort_announce: course=%s notified=%d holders, balance_due_by=%s",
            course_code, notified, due_by,
        )


def list_recent_changes(db: Session, limit: int = 100) -> list[dict[str, Any]]:
    """Return the N most recent catalog change events, newest first."""
    rows = (
        db.query(AcademyCatalogChangeEvent)
        .order_by(AcademyCatalogChangeEvent.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": row.id,
            "detected_at": row.detected_at,
            "course_code": row.course_code,
            "field": row.field,
            "before_value": row.before_value,
            "after_value": row.after_value,
            "commit_sha": row.commit_sha,
            "commit_message": row.commit_message,
        }
        for row in rows
    ]
