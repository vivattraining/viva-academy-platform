from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac
import hmac
import secrets
from typing import Optional, Set

from fastapi import Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AcademyAuthSession, AcademyUserCredential


SESSION_TTL_HOURS = 12
ALLOWED_ROLES = {"admin", "operations", "trainer", "student"}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def _jwt_secret() -> str:
    return settings.razorpay_webhook_secret or settings.zoom_client_secret or f"{settings.tenant_name}:{settings.app_env}:academy-auth"


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def encode_access_token(*, tenant_name: str, credential: AcademyUserCredential, session_token: str, expires_at: str) -> str:
    payload = {
        "sub": credential.email,
        "tenant_name": tenant_name,
        "full_name": credential.full_name,
        "role": credential.role,
        "sid": session_token,
        "exp": int(datetime.fromisoformat(expires_at).timestamp()),
        "iat": int(now_utc().timestamp()),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = ".".join(
        [
            _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")),
            _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")),
        ]
    )
    signature = hmac.new(_jwt_secret().encode("utf-8"), signing_input.encode("utf-8"), "sha256").digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as error:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from error

    signing_input = f"{header_b64}.{payload_b64}"
    expected = hmac.new(_jwt_secret().encode("utf-8"), signing_input.encode("utf-8"), "sha256").digest()
    actual = _b64url_decode(signature_b64)
    if not secrets.compare_digest(expected, actual):
        raise HTTPException(status_code=401, detail="Invalid bearer token")

    try:
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from error

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp < int(now_utc().timestamp()):
        raise HTTPException(status_code=401, detail="Expired bearer token")
    return payload


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


def list_credentials(db: Session, tenant_name: str) -> list[AcademyUserCredential]:
    return (
        db.query(AcademyUserCredential)
        .filter(AcademyUserCredential.tenant_name == tenant_name)
        .order_by(AcademyUserCredential.created_at.asc())
        .all()
    )


def tenant_has_credentials(db: Session, tenant_name: str) -> bool:
    return (
        db.query(AcademyUserCredential)
        .filter(AcademyUserCredential.tenant_name == tenant_name)
        .first()
        is not None
    )


def create_credential(db: Session, tenant_name: str, *, email: str, full_name: str, role: str, password: str) -> AcademyUserCredential:
    normalized_email = email.strip().lower()
    normalized_role = role.strip().lower()
    cleaned_name = full_name.strip()
    if "@" not in normalized_email:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if len(cleaned_name) < 2:
        raise HTTPException(status_code=422, detail="Full name must be at least 2 characters")
    if normalized_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    if len(password.strip()) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    current = now_iso()
    existing = (
        db.query(AcademyUserCredential)
        .filter(AcademyUserCredential.tenant_name == tenant_name, AcademyUserCredential.email == normalized_email)
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    record = AcademyUserCredential(
        tenant_name=tenant_name,
        email=normalized_email,
        full_name=cleaned_name,
        role=normalized_role,
        password_hash=hash_password(password),
        created_at=current,
        updated_at=current,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_credential(
    db: Session,
    tenant_name: str,
    *,
    email: str,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    password: Optional[str] = None,
) -> AcademyUserCredential:
    normalized_email = email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    record = (
        db.query(AcademyUserCredential)
        .filter(AcademyUserCredential.tenant_name == tenant_name, AcademyUserCredential.email == normalized_email)
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="User not found")
    if full_name is not None:
        cleaned_name = full_name.strip()
        if len(cleaned_name) < 2:
            raise HTTPException(status_code=422, detail="Full name must be at least 2 characters")
        record.full_name = cleaned_name
    if role is not None:
        normalized_role = role.strip().lower()
        if normalized_role not in ALLOWED_ROLES:
            raise HTTPException(status_code=422, detail="Invalid role")
        record.role = normalized_role
    if password is not None:
        if len(password.strip()) < 8:
            raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
        record.password_hash = hash_password(password)
    record.updated_at = now_iso()
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def revoke_sessions_for_email(db: Session, tenant_name: str, email: str) -> int:
    normalized_email = email.strip().lower()
    sessions = (
        db.query(AcademyAuthSession)
        .filter(
            AcademyAuthSession.tenant_name == tenant_name,
            AcademyAuthSession.email == normalized_email,
            AcademyAuthSession.revoked_at.is_(None),
        )
        .all()
    )
    revoked_at = now_iso()
    for record in sessions:
        record.revoked_at = revoked_at
        db.add(record)
    db.commit()
    return len(sessions)


def revoke_session(db: Session, tenant_name: str, session_token: str) -> bool:
    record = (
        db.query(AcademyAuthSession)
        .filter(
            AcademyAuthSession.tenant_name == tenant_name,
            AcademyAuthSession.session_token == session_token,
            AcademyAuthSession.revoked_at.is_(None),
        )
        .first()
    )
    if record is None:
        return False
    record.revoked_at = now_iso()
    db.add(record)
    db.commit()
    return True


def bootstrap_admin_user(db: Session, tenant_name: str, *, email: str, full_name: str, password: str) -> dict:
    if tenant_has_credentials(db, tenant_name):
        raise HTTPException(status_code=409, detail="Admin bootstrap is already completed for this tenant")
    credential = create_credential(
        db,
        tenant_name,
        email=email,
        full_name=full_name,
        role="admin",
        password=password,
    )
    return create_session(db, tenant_name, credential)


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
    access_token = encode_access_token(
        tenant_name=tenant_name,
        credential=credential,
        session_token=token,
        expires_at=expires_at,
    )
    return {
        "session_token": token,
        "access_token": access_token,
        "token_type": "bearer",
        "tenant_name": tenant_name,
        "email": credential.email,
        "full_name": credential.full_name,
        "role": credential.role,
        "created_at": created_at,
        "expires_at": expires_at,
    }


def login_user(db: Session, tenant_name: str, email: str, password: str) -> dict:
    normalized_email = email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if len(password.strip()) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if settings.allow_demo_auth:
        ensure_default_users(db, tenant_name)
    credential = (
        db.query(AcademyUserCredential)
        .filter(AcademyUserCredential.tenant_name == tenant_name, AcademyUserCredential.email == normalized_email)
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


def resolve_session_token(
    session_token: Optional[str],
    authorization: Optional[str],
) -> Optional[str]:
    if session_token:
        return session_token
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    payload = decode_access_token(token)
    sid = payload.get("sid")
    if not isinstance(sid, str) or not sid:
        raise HTTPException(status_code=401, detail="Invalid bearer token")
    return sid


def require_session(
    db: Session,
    tenant_name: str,
    session_token: Optional[str],
    authorization: Optional[str] = None,
    allowed_roles: Optional[Set[str]] = None,
) -> dict:
    resolved_token = resolve_session_token(session_token, authorization)
    if not resolved_token:
        raise HTTPException(status_code=401, detail="Session token required")
    record = get_session_record(db, resolved_token)
    if record is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if record.tenant_name != tenant_name:
        raise HTTPException(status_code=403, detail="Session does not match tenant")
    if allowed_roles and record.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Session does not have permission")
    access_token = encode_access_token(
        tenant_name=record.tenant_name,
        credential=AcademyUserCredential(
            tenant_name=record.tenant_name,
            email=record.email,
            full_name=record.full_name,
            role=record.role,
            password_hash="",
            created_at=record.created_at,
            updated_at=record.created_at,
        ),
        session_token=record.session_token,
        expires_at=record.expires_at,
    )
    return {
        "tenant_name": record.tenant_name,
        "email": record.email,
        "full_name": record.full_name,
        "role": record.role,
        "session_token": record.session_token,
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": record.expires_at,
        "created_at": record.created_at,
    }


def auth_dependency(
    db: Session,
    tenant_name: str,
    x_academy_session: Optional[str],
    authorization: Optional[str],
    allowed_roles: Optional[Set[str]] = None,
) -> dict:
    return require_session(db, tenant_name, x_academy_session, authorization, allowed_roles)
