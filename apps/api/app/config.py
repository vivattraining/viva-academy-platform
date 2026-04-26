from dataclasses import dataclass
import os

def env_flag(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    allow_demo_auth: bool = env_flag("ALLOW_DEMO_AUTH", "false")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./academy_os.db")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    app_url: str = os.getenv("APP_URL", "https://www.vivacareeracademy.com")
    tenant_name: str = os.getenv("TENANT_NAME", "Viva Career Academy")
    tenant_domain: str = os.getenv("TENANT_DOMAIN", "www.vivacareeracademy.com")

    zoom_account_id: str = os.getenv("ZOOM_ACCOUNT_ID", "")
    zoom_client_id: str = os.getenv("ZOOM_CLIENT_ID", "")
    zoom_client_secret: str = os.getenv("ZOOM_CLIENT_SECRET", "")
    zoom_webhook_secret_token: str = os.getenv("ZOOM_WEBHOOK_SECRET_TOKEN", "")
    zoom_host_email: str = os.getenv("ZOOM_HOST_EMAIL", "tech@vivacareeracademy.com")
    zoom_default_timezone: str = os.getenv("ZOOM_DEFAULT_TIMEZONE", "Asia/Kolkata")

    razorpay_key_id: str = os.getenv("RAZORPAY_KEY_ID", "")
    razorpay_key_secret: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    razorpay_webhook_secret: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    whatsapp_api_token: str = os.getenv("WHATSAPP_API_TOKEN", "")
    whatsapp_phone_id: str = os.getenv("WHATSAPP_PHONE_ID", "")

    # Dedicated secret for signing academy auth JWTs. If unset in production
    # the API refuses to issue tokens (see app.auth._jwt_secret).
    academy_jwt_secret: str = os.getenv("ACADEMY_JWT_SECRET", "")
    # Required header value for POST /auth/bootstrap-admin. Without it, the
    # endpoint returns 403 even when the tenant has no admin yet, eliminating
    # the public race-condition where the first caller becomes admin.
    academy_bootstrap_token: str = os.getenv("ACADEMY_BOOTSTRAP_TOKEN", "")
    # Comma-separated allowlist of frontend origins for CORS. When unset the
    # API falls back to the production domain only.
    cors_allowed_origins: str = os.getenv("CORS_ALLOWED_ORIGINS", "")


settings = Settings()
