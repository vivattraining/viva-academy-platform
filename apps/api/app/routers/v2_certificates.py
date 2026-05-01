"""
v2 — certificate issuance + public verification.

Two endpoints:

  POST  /api/v1/academy/certificates/issue/secure
        Admin/operations issue a certificate to a learner who has
        completed the course. Returns the new row + the public
        verification URL.

  GET   /api/v1/academy/certificates/verify/{token}
        Public, no auth required. Token is the opaque verification_token
        stored on V2Certificate at issuance. Returns the certificate
        metadata for the rendering route at /certificates/<token>.

This is the v2 implementation that replaces the old roster placeholder
URL (§17.5). Once the v2 schema is migrated in production, the roster
workbench should call /certificates/issue/secure instead of writing a
fake URL into the application row.
"""

from __future__ import annotations

import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.auth import auth_dependency
from app.db import get_db
from app.store import now_iso
from app.v2_models import V2Certificate

router = APIRouter()


@router.post("/certificates/issue/secure")
def issue_certificate_secure(
    payload: dict,
    x_academy_session: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Issue a certificate to a learner. Admin/operations only.

    Body: {
      "tenant_name": str,
      "course_id": int,
      "course_name": str,
      "student_email": str,
      "student_name": str,
      "grade": str | null,        // optional
      "valid_until": str | null,  // optional ISO date
    }
    """
    tenant_name = (payload.get("tenant_name") or "").strip()
    if not tenant_name:
        raise HTTPException(status_code=422, detail="tenant_name required")

    auth_dependency(
        db, tenant_name, x_academy_session, authorization,
        {"admin", "operations"},
    )

    student_email = (payload.get("student_email") or "").strip().lower()
    student_name = (payload.get("student_name") or "").strip()
    course_id_raw = payload.get("course_id")
    course_name = (payload.get("course_name") or "").strip()

    if not student_email or "@" not in student_email:
        raise HTTPException(status_code=422, detail="student_email required and valid")
    if not student_name:
        raise HTTPException(status_code=422, detail="student_name required")
    if not course_name:
        raise HTTPException(status_code=422, detail="course_name required")
    try:
        course_id = int(course_id_raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="course_id must be an integer")

    # Idempotent: one certificate per (tenant, course, student).
    existing = (
        db.query(V2Certificate)
        .filter(
            V2Certificate.tenant_name == tenant_name,
            V2Certificate.course_id == course_id,
            V2Certificate.student_email == student_email,
        )
        .first()
    )
    if existing is not None:
        return {"ok": True, "idempotent": True, "certificate": _serialize(existing)}

    serial_number = _new_serial_number(course_id)
    verification_token = secrets.token_urlsafe(24)
    current = now_iso()

    record = V2Certificate(
        tenant_name=tenant_name,
        course_id=course_id,
        student_email=student_email,
        student_name=student_name,
        course_name=course_name,
        serial_number=serial_number,
        issued_at=current,
        valid_until=(payload.get("valid_until") or None),
        grade=(payload.get("grade") or None),
        issuer=payload.get("issuer") or "Viva Career Academy",
        verification_token=verification_token,
        created_at=current,
        updated_at=current,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"ok": True, "certificate": _serialize(record)}


@router.get("/certificates/verify/{token}")
def verify_certificate(token: str, db: Session = Depends(get_db)):
    """
    Public verification endpoint — no auth. Anyone with the token can
    view the certificate metadata. Without the token, certificates can't
    be enumerated. The token has 24 bytes of entropy (~144 bits).
    """
    if not token or len(token) < 8:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert = (
        db.query(V2Certificate)
        .filter(V2Certificate.verification_token == token)
        .first()
    )
    if cert is None:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"ok": True, "certificate": _serialize(cert)}


def _new_serial_number(course_id: int) -> str:
    """Format: VCA-<course>-<short-hash> e.g. VCA-001-9F3A2C."""
    short = secrets.token_hex(3).upper()
    return f"VCA-{course_id:03d}-{short}"


def _serialize(c: V2Certificate) -> dict:
    return {
        "id": c.id,
        "serial_number": c.serial_number,
        "student_name": c.student_name,
        "student_email": c.student_email,
        "course_name": c.course_name,
        "course_id": c.course_id,
        "issued_at": c.issued_at,
        "valid_until": c.valid_until,
        "grade": c.grade,
        "issuer": c.issuer,
        "verification_url": f"https://www.vivacareeracademy.com/certificates/{c.verification_token}",
        "verification_token": c.verification_token,
    }
