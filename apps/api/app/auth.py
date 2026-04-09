from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac
import secrets
from typing import Optional, Set

from fastapi import Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AcademyAuthSession, AcademyUserCredential


SESSION_TTL_HOURS = 12


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def hash_password(password: str, salt: Optional[str] = None) -> str:
    resolved_salt = salt or secrets.token_hex(16)
    iterations = 120000
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), resolved_salt.encode("utf-8"), iterations).hex()
    return f"pbkdf2_sha256${iterations}${resolved_salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, _iterations, salt, _digest = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        return secrets.compare_digest(hash_password(password, salt), stored_hash)
    except ValueError:
        return False


def ensure_default_users(db: Session, tenant_name: str) -> None:
    defaults = [
        ("admin@viva.demo", "VIVA Admin", "admin", "VIVAadmin123"),
        ("ops@viva.demo", "Operations Lead", "operations", "VIVAops123"),
        ("trainer@viva.demo", "Lead Trainer", "trainer", "VIVAtrainer123"),
        ("student@viva.demo", "Demo Student", "student", "VIVAstudent123"),
    ]
    current = now_iso()
    for email, full_name, role, password in defaults:
        existing = (
            db.query(AcademyUserCredential)
            .filter(AcademyUserCredential.tenant_name == tenant_name, AcademyUserCredential.email == email)
            .first()
        )
        if existing:
            continue
        db.add(
            AcademyUserCredential(
                tenant_name=tenant_name,
                email=email,
                full_name=full_name,
                role=role,
                password_hash=hash_password(password),
                created_at=current,
                updated_at=current,
            )
        )
    db.commit()


def create_session(db: Session, tenant_name: str, credential: AcademyUserCredential) -> dict:
    token = f"acad_{secrets.token_urlsafe(24)}"
    created_at = now_iso()
    expires_at = (now_utc() + timedelta(hours=SESSION_TTL_HOURS)).isoformat()
    record = AcademyAuthSession(
        session_token=token,
        tenant_name=tenant_name,
        email=credential.email,
        full_name=credential.full_name,
        role=credential.role,
        created_at=created_at,
        expires_at=expires_at,
        revoked_at=None,
    )
    db.add(record)
    db.commit()
    return {
        "session_token": token,
        "tenant_name": tenant_name,
        "email": credential.email,
        "full_name": credential.full_name,
        "role": credential.role,
        "created_at": created_at,
        "expires_at": expires_at,
    }


def login_user(db: Session, tenant_name: str, email: str, password: str) -> dict:
    if settings.allow_demo_auth:
        ensure_default_users(db, tenant_name)
    credential = (
        db.query(AcademyUserCredential)
        .filter(AcademyUserCredential.tenant_name == tenant_name, AcademyUserCredential.email == email.strip().lower())
        .first()
    )
    if credential is None or not verify_password(password, credential.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return create_session(db, tenant_name, credential)


def get_session_record(db: Session, session_token: str) -> Optional[AcademyAuthSession]:
    record = (
        db.query(AcademyAuthSession)
        .filter(AcademyAuthSession.session_token == session_token, AcademyAuthSession.revoked_at.is_(None))
        .first()
    )
    if record is None:
        return None
    try:
        if datetime.fromisoformat(record.expires_at) < now_utc():
            return None
    except ValueError:
        return None
    return record


def require_session(
    db: Session,
    tenant_name: str,
    session_token: Optional[str],
    allowed_roles: Optional[Set[str]] = None,
) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="Session token required")
    record = get_session_record(db, session_token)
    if record is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if record.tenant_name != tenant_name:
        raise HTTPException(status_code=403, detail="Session does not match tenant")
    if allowed_roles and record.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Session does not have permission")
    return {
        "tenant_name": record.tenant_name,
        "email": record.email,
        "full_name": record.full_name,
        "role": record.role,
        "session_token": record.session_token,
        "expires_at": record.expires_at,
    }


def auth_dependency(db: Session, tenant_name: str, x_academy_session: Optional[str], allowed_roles: Optional[Set[str]] = None) -> dict:
    return require_session(db, tenant_name, x_academy_session, allowed_roles)
