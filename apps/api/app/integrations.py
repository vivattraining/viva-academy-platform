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
            "payment_url": f"https://payments.vivacareeracademy.com/checkout/{order_id}",
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


def _razorpay_auth_header() -> str:
    return b64encode(f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode("utf-8")).decode("utf-8")


def fetch_payment_status(*, order_id: str) -> dict:
    if razorpay_mode() != "live":
        return {
            "mode": "mock",
            "order_id": order_id,
            "order_status": "created",
            "payment_id": None,
            "payment_status": "pending",
            "captured": False,
            "verified": False,
        }

    auth = _razorpay_auth_header()
    try:
        order = _json_request(
            f"https://api.razorpay.com/v1/orders/{order_id}",
            headers={"Authorization": f"Basic {auth}"},
        )
        payments = _json_request(
            f"https://api.razorpay.com/v1/orders/{order_id}/payments",
            headers={"Authorization": f"Basic {auth}"},
        )
    except Exception as error:
        _raise_provider_error(error, "Unable to fetch Razorpay payment status")

    payment_items = payments.get("items", []) if isinstance(payments, dict) else []
    prioritized_payment = next(
        (
            item for item in payment_items
            if item.get("status") in {"captured", "authorized", "failed", "created"}
        ),
        payment_items[0] if payment_items else {},
    )
    payment_status = prioritized_payment.get("status") or ("paid" if order.get("status") == "paid" else "pending")
    captured = payment_status == "captured" or order.get("status") == "paid"

    return {
        "mode": "live",
        "order_id": order_id,
        "order_status": order.get("status", "created"),
        "payment_id": prioritized_payment.get("id"),
        "payment_status": payment_status,
        "captured": captured,
        "verified": captured,
    }


# ---------------------------------------------------------------------------
# Resend (transactional email)
# ---------------------------------------------------------------------------

import logging  # noqa: E402  (logger lives at module bottom by convention)

_email_logger = logging.getLogger(__name__)

# Default sender. Override at call-site if needed. Must be a verified
# domain in Resend (https://resend.com/domains) — until that's done,
# delivery falls back to a no-op + log warning.
DEFAULT_EMAIL_FROM = "Viva Career Academy <admission@vivacareeracademy.com>"
RESEND_API_URL = "https://api.resend.com/emails"


def email_mode() -> str:
    """Return 'live' if Resend is configured, 'mock' otherwise.

    'mock' means send_email() will log the message instead of delivering.
    Useful for local dev and for the period before the Resend domain is
    verified (key configured but mail can't actually go out).
    """
    return "live" if settings.resend_api_key else "mock"


def send_email(
    *,
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    from_address: str = DEFAULT_EMAIL_FROM,
    reply_to: Optional[str] = None,
) -> Dict[str, str]:
    """Send a transactional email via Resend.

    Graceful no-op pattern: if RESEND_API_KEY is missing or empty, this
    logs the would-be email at INFO level and returns
    `{"mode": "mock"}` instead of raising. That way callers (e.g. the
    Razorpay webhook) don't fail when Resend isn't yet wired up — the
    payment still completes; only the notification is skipped.

    Once the env var is set and the sending domain is verified in
    Resend's dashboard, emails start delivering automatically with
    no code change required.

    Returns: {"mode": "live", "id": "<resend-message-id>"} on success,
             {"mode": "mock"} when key is missing,
             {"mode": "error", "detail": "..."} on delivery failure.
    """
    if not settings.resend_api_key:
        _email_logger.info(
            "[email mock] would send to=%s subject=%r — Resend API key not configured",
            to, subject,
        )
        return {"mode": "mock"}

    body = {
        "from": from_address,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        body["text"] = text
    if reply_to:
        body["reply_to"] = reply_to

    try:
        result = _json_request(
            RESEND_API_URL,
            method="POST",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            body=body,
        )
        message_id = result.get("id", "")
        _email_logger.info("[email] sent id=%s to=%s subject=%r", message_id, to, subject)
        return {"mode": "live", "id": message_id}
    except Exception as send_err:  # noqa: BLE001
        # Never fail the caller on email errors — log and continue. The
        # operator can manually re-send from the admin if needed.
        _email_logger.error(
            "[email] delivery failed to=%s subject=%r err=%s",
            to, subject, send_err,
        )
        return {"mode": "error", "detail": str(send_err)}


def render_balance_reminder_email(
    *,
    student_name: str,
    course_name: str,
    cohort_label: str,
    balance_amount: float,
    balance_due_by: str,
    application_id: str,
    currency: str = "INR",
) -> Dict[str, str]:
    """Build the balance-reminder email sent when a coming-soon course's
    cohort date is announced.

    The cohort-announce hook in catalog_audit fires this when a course
    flips from coming_soon=True → False. Tells the student the cohort
    is confirmed and the balance is due within 14 days, with a payment
    link they can click.
    """
    currency_symbol = "₹" if currency.upper() == "INR" else currency
    balance_str = f"{currency_symbol}{int(round(balance_amount)):,}"
    first_name = (student_name or "").strip().split(" ")[0] or "there"
    pay_url = f"https://www.vivacareeracademy.com/payment/balance/{application_id}"

    subject = f"Cohort confirmed · balance {balance_str} due in 14 days · {course_name}"
    text = (
        f"Hi {first_name},\n\n"
        f"Good news — the cohort start date for {course_name} has been "
        f"confirmed: {cohort_label}.\n\n"
        f"As per your reservation, the balance of {balance_str} is now "
        f"due within 14 days, by {balance_due_by[:10]}.\n\n"
        f"Pay the balance here: {pay_url}\n\n"
        f"Once the balance is paid, your enrolment is confirmed and you'll "
        f"receive your student-portal credentials within 24 hours.\n\n"
        f"Questions? Reply to this email or write to "
        f"admission@vivacareeracademy.com.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<h2 style=\"color:#0B1F3A;margin:0 0 16px;\">Cohort confirmed</h2>"
        f"<p>Hi {first_name},</p>"
        f"<p>Good news — the cohort start date for "
        f"<strong>{course_name}</strong> has been confirmed: "
        f"<strong>{cohort_label}</strong>.</p>"
        f"<table style=\"border-collapse:collapse;margin:16px 0;\">"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">Balance due</td>"
        f"<td style=\"padding:6px 0;font-weight:700;\">{balance_str}</td></tr>"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">Due by</td>"
        f"<td style=\"padding:6px 0;font-weight:700;\">{balance_due_by[:10]}</td></tr>"
        f"</table>"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{pay_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">Pay balance now</a>"
        f"</p>"
        f"<p>Once the balance is paid, your enrolment is confirmed and you'll "
        f"receive your student-portal credentials within 24 hours.</p>"
        f"<p>Questions? Reply to this email or write to "
        f"<a href=\"mailto:admission@vivacareeracademy.com\">admission@vivacareeracademy.com</a>.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}


def render_reservation_confirmation_email(
    *,
    student_name: str,
    course_name: str,
    reservation_amount: float,
    balance_amount: float,
    currency: str = "INR",
) -> Dict[str, str]:
    """Build the reservation-confirmation email (subject + html + text).

    Sent when a coming-soon course's reservation payment captures
    successfully on the Razorpay webhook. Tells the student their
    seat is reserved and the balance is due within 14 days of cohort
    announcement.
    """
    currency_symbol = "₹" if currency.upper() == "INR" else currency
    reservation_str = f"{currency_symbol}{int(round(reservation_amount)):,}"
    balance_str = f"{currency_symbol}{int(round(balance_amount)):,}"
    first_name = (student_name or "").strip().split(" ")[0] or "there"

    subject = f"Seat reserved · {course_name}"
    text = (
        f"Hi {first_name},\n\n"
        f"Your seat for {course_name} is reserved.\n\n"
        f"Reservation paid: {reservation_str}\n"
        f"Balance due: {balance_str}\n\n"
        f"The cohort start date will be confirmed shortly. Once announced, "
        f"the balance ({balance_str}) is due within 14 days. We'll send a "
        f"separate email with the payment link and exact due date.\n\n"
        f"If you have any questions, reply to this email or write to "
        f"admission@vivacareeracademy.com.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<h2 style=\"color:#0B1F3A;margin:0 0 16px;\">Seat reserved</h2>"
        f"<p>Hi {first_name},</p>"
        f"<p>Your seat for <strong>{course_name}</strong> is reserved.</p>"
        f"<table style=\"border-collapse:collapse;margin:16px 0;\">"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">Reservation paid</td>"
        f"<td style=\"padding:6px 0;font-weight:700;\">{reservation_str}</td></tr>"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">Balance due</td>"
        f"<td style=\"padding:6px 0;font-weight:700;\">{balance_str}</td></tr>"
        f"</table>"
        f"<p>The cohort start date will be confirmed shortly. Once announced, "
        f"the balance (<strong>{balance_str}</strong>) is due within "
        f"<strong>14 days</strong>. We'll send a separate email with the "
        f"payment link and exact due date.</p>"
        f"<p>If you have any questions, reply to this email or write to "
        f"<a href=\"mailto:admission@vivacareeracademy.com\">admission@vivacareeracademy.com</a>.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}
