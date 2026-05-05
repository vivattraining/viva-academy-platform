from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine
from app import models  # noqa: F401
from app.routers import academy, cron, health

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Academy OS API",
    version="0.1.0",
    description="Standalone backend for VIVA and future white-label academy tenants."
)


def _resolve_cors_origins() -> list[str]:
    """Compute the CORS allowlist.

    Priority:
      1. CORS_ALLOWED_ORIGINS env var (comma-separated).
      2. APP_URL env var (single origin).
      3. Production domain default.
    Local development additionally permits common localhost origins.
    """
    raw = settings.cors_allowed_origins.strip()
    if raw:
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    elif settings.app_url:
        origins = [settings.app_url.rstrip("/")]
    else:
        origins = ["https://www.vivacareeracademy.com"]

    if settings.app_env != "production":
        for local in ("http://localhost:3000", "http://127.0.0.1:3000"):
            if local not in origins:
                origins.append(local)
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Academy-Session",
        "X-Bootstrap-Token",
        "X-Razorpay-Signature",
    ],
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(academy.router, prefix="/api/v1/academy", tags=["academy"])
app.include_router(cron.router, prefix="/api/v1/cron", tags=["cron"])


@app.get("/")
def read_root():
    return {
        "message": "Academy OS API is live"
    }
