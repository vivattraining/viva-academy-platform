from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "mode": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/readiness")
def readiness_check():
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
            "configured": bool(settings.razorpay_key_id and settings.razorpay_key_secret and settings.razorpay_webhook_secret),
        },
        "zoom": {
            "configured": bool(settings.zoom_account_id and settings.zoom_client_id and settings.zoom_client_secret and settings.zoom_webhook_secret_token),
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
        if name not in {"database", "frontend_api_url", "demo_auth"} and not value["configured"]
    ]
    return {
        "status": "ready" if not blockers and not settings.allow_demo_auth else "attention_required",
        "mode": settings.app_env,
        "checks": checks,
        "blockers": blockers,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
