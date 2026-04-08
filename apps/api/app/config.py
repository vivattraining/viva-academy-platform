from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./academy_os.db")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    zoom_account_id: str = os.getenv("ZOOM_ACCOUNT_ID", "")
    zoom_client_id: str = os.getenv("ZOOM_CLIENT_ID", "")
    zoom_client_secret: str = os.getenv("ZOOM_CLIENT_SECRET", "")
    zoom_webhook_secret_token: str = os.getenv("ZOOM_WEBHOOK_SECRET_TOKEN", "")
    zoom_host_email: str = os.getenv("ZOOM_HOST_EMAIL", "faculty@vivatraininginstitute.com")
    zoom_default_timezone: str = os.getenv("ZOOM_DEFAULT_TIMEZONE", "Asia/Kolkata")

    razorpay_key_id: str = os.getenv("RAZORPAY_KEY_ID", "")
    razorpay_key_secret: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    razorpay_webhook_secret: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    whatsapp_api_token: str = os.getenv("WHATSAPP_API_TOKEN", "")
    whatsapp_phone_id: str = os.getenv("WHATSAPP_PHONE_ID", "")


settings = Settings()

