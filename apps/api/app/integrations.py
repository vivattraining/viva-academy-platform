from __future__ import annotations

from base64 import b64encode
from datetime import datetime
import json
from typing import Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from app.config import settings


def _json_request(url: str, *, method: str = "GET", headers: Optional[Dict[str, str]] = None, body: Optional[dict] = None) -> dict:
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    request = Request(url, data=payload, method=method, headers=headers or {})
    with urlopen(request, timeout=20) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw or "{}")


def _raise_provider_error(error: Exception, default_message: str) -> None:
    if isinstance(error, HTTPError):
        detail = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(detail or default_message)
    if isinstance(error, URLError):
        raise RuntimeError(default_message)
    raise RuntimeError(str(error) or default_message)


def zoom_mode() -> str:
    if settings.zoom_account_id and settings.zoom_client_id and settings.zoom_client_secret:
        return "live"
    return "mock"


def _zoom_access_token() -> Optional[str]:
    if zoom_mode() != "live":
        return None
    query = urlencode({
        "grant_type": "account_credentials",
        "account_id": settings.zoom_account_id,
    })
    auth = b64encode(f"{settings.zoom_client_id}:{settings.zoom_client_secret}".encode("utf-8")).decode("utf-8")
    try:
        data = _json_request(
            f"https://zoom.us/oauth/token?{query}",
            method="POST",
            headers={"Authorization": f"Basic {auth}"},
        )
        return data.get("access_token")
    except Exception as error:
        _raise_provider_error(error, "Unable to get Zoom access token")


def provision_zoom_meeting(*, tenant_name: str, session_id: str, session_title: str, session_date: str, start_time: str, end_time: str, host_email: Optional[str], timezone: Optional[str]) -> dict:
    resolved_host = host_email or settings.zoom_host_email
    resolved_timezone = timezone or settings.zoom_default_timezone
    if zoom_mode() != "live":
        meeting_id = f"zoom_{uuid4().hex[:12]}"
        return {
            "mode": "mock",
            "tenant_name": tenant_name,
            "session_id": session_id,
            "host_email": resolved_host,
            "timezone": resolved_timezone,
            "meeting_id": meeting_id,
            "join_url": f"https://zoom.us/j/{meeting_id}",
            "start_url": f"https://zoom.us/s/{meeting_id}?zak=mock",
            "topic": session_title,
            "scheduled_for": f"{session_date}T{start_time}",
            "duration_hint": f"{start_time}-{end_time}",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

    token = _zoom_access_token()
    if not token:
        raise RuntimeError("Zoom access token could not be issued")

    start_at = f"{session_date}T{start_time}:00"
    try:
        data = _json_request(
            f"https://api.zoom.us/v2/users/{resolved_host}/meetings",
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            body={
                "topic": session_title,
                "type": 2,
                "start_time": start_at,
                "timezone": resolved_timezone,
                "settings": {
                    "host_video": True,
                    "participant_video": True,
                    "join_before_host": False,
                    "waiting_room": True,
                },
            },
        )
    except Exception as error:
        _raise_provider_error(error, "Unable to provision Zoom meeting")

    return {
        "mode": "live",
        "tenant_name": tenant_name,
        "session_id": session_id,
        "host_email": resolved_host,
        "timezone": resolved_timezone,
        "meeting_id": str(data.get("id")),
        "join_url": data.get("join_url"),
        "start_url": data.get("start_url"),
        "topic": session_title,
        "scheduled_for": start_at,
        "duration_hint": f"{start_time}-{end_time}",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }


def razorpay_mode() -> str:
    if settings.razorpay_key_id and settings.razorpay_key_secret:
        return "live"
    return "mock"


def create_payment_link(*, application_id: str, amount_due: float, currency: str) -> dict:
    if razorpay_mode() != "live":
        order_id = f"order_{uuid4().hex[:14]}"
        return {
          "mode": "mock",
          "order_id": order_id,
          "payment_reference": application_id,
          "payment_url": f"https://payments.vivatraininginstitute.com/checkout/{order_id}",
          "amount_due": amount_due,
          "currency": currency,
        }

    auth = b64encode(f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode("utf-8")).decode("utf-8")
    try:
        data = _json_request(
            "https://api.razorpay.com/v1/orders",
            method="POST",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/json",
            },
            body={
                "amount": int(round(amount_due * 100)),
                "currency": currency,
                "receipt": application_id,
                "notes": {
                    "application_id": application_id,
                },
            },
        )
    except Exception as error:
        _raise_provider_error(error, "Unable to create Razorpay order")

    order_id = data.get("id", f"order_{uuid4().hex[:14]}")
    return {
        "mode": "live",
        "order_id": order_id,
        "payment_reference": application_id,
        "payment_url": f"https://checkout.razorpay.com/v1/checkout.js?order_id={order_id}",
        "amount_due": amount_due,
        "currency": currency,
    }
