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

