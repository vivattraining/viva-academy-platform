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
    return {"status": "changes_recorded", "events": len(events), "hash": current_hash}


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
