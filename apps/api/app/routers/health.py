"""
Health + readiness endpoints.

- GET /api/v1/health     Public liveness probe. Returns 200 when the API
                         function is running AND the database round-trips
                         a SELECT 1 within ~1 second. Returns 503 when
                         the DB ping fails — Vercel / uptime monitors can
                         alert on the status change.

- GET /api/v1/readiness  Public-but-minimal status. Returns whether all
                         configured integrations are present, without
                         naming them. Auditors who want the full
                         breakdown must supply X-Readiness-Token (audit
                         row H-I3, 16 May 2026).
"""

from __future__ import annotations

import hmac
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, Response
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/health")
def health_check(response: Response, db: Session = Depends(get_db)):
    """Liveness probe with DB round-trip.

    H-I4 (16 May 2026): previously this returned 200 unconditionally, so
    a Neon outage or a misconfigured DATABASE_URL gave false-green
    health. Now we run `SELECT 1` and surface 503 when the DB doesn't
    answer. Latency is captured so a slow-but-alive DB shows up in
    uptime dashboards without flipping the status.
    """
    db_ok = False
    db_latency_ms: Optional[int] = None
    db_error: Optional[str] = None
    started = datetime.now(timezone.utc)
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
        db_latency_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    except SQLAlchemyError as exc:
        db_error = f"{type(exc).__name__}: {exc}"
        logger.error("health: db SELECT 1 failed: %s", db_error)
    except Exception as exc:  # noqa: BLE001
        db_error = f"{type(exc).__name__}: {exc}"
        logger.error("health: db ping failed: %s", db_error)

    if not db_ok:
        response.status_code = 503
        return {
            "status": "unhealthy",
            "mode": settings.app_env,
            "db": {"ok": False, "error": db_error},
            "timestamp": _now_iso(),
        }

    return {
        "status": "healthy",
        "mode": settings.app_env,
        "db": {"ok": True, "latency_ms": db_latency_ms},
        "timestamp": _now_iso(),
    }


def _readiness_token_ok(provided: Optional[str]) -> bool:
    """Constant-time check of the X-Readiness-Token header."""
    expected = (getattr(settings, "readiness_token", "") or "").strip()
    if not expected:
        return False
    candidate = (provided or "").strip()
    if not candidate:
        return False
    return hmac.compare_digest(candidate.encode("utf-8"), expected.encode("utf-8"))


@router.get("/readiness")
def readiness_check(
    x_readiness_token: Optional[str] = Header(default=None, alias="X-Readiness-Token"),
):
    """Minimal-leak readiness probe.

    H-I3 (16 May 2026): the old version returned the full integration
    topology (DB engine, razorpay/zoom/resend/whatsapp configuration
    flags, env mode, named blockers) to anonymous callers — useful
    reconnaissance for an attacker mapping the stack.

    Default response now reports only:
      - mode (production / development / etc.)
      - status: "ready" | "attention_required"
      - blocker_count: integer (no names)

    Callers presenting a valid X-Readiness-Token (env-keyed via
    READINESS_TOKEN) receive the full detailed breakdown for ops
    dashboards.
    """
    checks = {
        "database": {
            "configured": bool(settings.database_url),
            "engine": "sqlite" if settings.database_url.startswith("sqlite") else "postgresql",
        },
        "frontend_api_url": {
            "configured": bool(settings.app_url),
        },
        "demo_auth": {
            "configured": True,
            "enabled": settings.allow_demo_auth,
        },
        "razorpay": {
            "configured": bool(
                settings.razorpay_key_id
                and settings.razorpay_key_secret
                and settings.razorpay_webhook_secret
            ),
        },
        "zoom": {
            "configured": bool(
                settings.zoom_account_id
                and settings.zoom_client_id
                and settings.zoom_client_secret
                and settings.zoom_webhook_secret_token
            ),
        },
        "resend": {
            "configured": bool(settings.resend_api_key),
        },
        "whatsapp": {
            "configured": bool(settings.whatsapp_api_token and settings.whatsapp_phone_id),
        },
    }
    blockers = [
        name for name, value in checks.items()
        if name not in {"database", "frontend_api_url", "demo_auth"}
        and not value["configured"]
    ]
    status = "ready" if not blockers and not settings.allow_demo_auth else "attention_required"

    minimal = {
        "status": status,
        "mode": settings.app_env,
        "blocker_count": len(blockers),
        "timestamp": _now_iso(),
    }

    if _readiness_token_ok(x_readiness_token):
        return {
            **minimal,
            "checks": checks,
            "blockers": blockers,
        }
    return minimal
