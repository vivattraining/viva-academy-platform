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


# ---------------------------------------------------------------------------
# Email-template helpers — May 2026 batch.
#
# Each function returns {subject, html, text} for one transactional email.
# All share the same Editorial visual language: cream + navy + gold,
# Helvetica/Arial fallback, max-width 560px, gold left-border on key
# panels. Names are interpolated; HTML escapes are minimal because the
# values come from server-controlled rows (course names from the
# catalog, application data validated at intake) — but every callsite
# should still treat user-supplied fields as untrusted (see audit #22).
# ---------------------------------------------------------------------------


def _format_currency(amount: float, currency: str = "INR") -> str:
    symbol = "₹" if currency.upper() == "INR" else currency
    return f"{symbol}{int(round(amount)):,}"


def _first_name(full_name: str) -> str:
    return (full_name or "").strip().split(" ")[0] or "there"


def render_application_received_email(
    *,
    student_name: str,
    course_name: str,
    cohort_label: str,
    is_reservation: bool,
    amount_due: float,
    application_id: str,
    currency: str = "INR",
) -> Dict[str, str]:
    """Sent immediately after an applicant submits the form on /apply.

    Confirms receipt, restates the chosen programme + fee, and links the
    student back to their receipt + payment URL so they can complete
    payment from any device. Reservations and full-fee applications get
    slightly different copy.
    """
    first = _first_name(student_name)
    amount = _format_currency(amount_due, currency)
    receipt_url = f"https://www.vivacareeracademy.com/payment/receipt/{application_id}"

    if is_reservation:
        subject = f"Application received · reserve your seat for {course_name}"
        intro = (
            f"Thanks for applying to <strong>{course_name}</strong>. "
            f"Your application is on file and your seat is held pending "
            f"the {amount} reservation advance."
        )
        next_step = (
            f"To lock the seat, complete the {amount} advance payment. "
            f"You can do that from the receipt page below — pay any time "
            f"in the next 7 days, balance is due 14 days after the cohort "
            f"date is confirmed."
        )
    else:
        subject = f"Application received · {course_name}"
        intro = (
            f"Thanks for applying to <strong>{course_name}</strong>. "
            f"Your application is on file."
        )
        next_step = (
            f"To complete admission, pay the programme fee of {amount} "
            f"from the receipt page below. Your seat in the {cohort_label} "
            f"cohort is reserved while payment is pending."
        )

    text = (
        f"Hi {first},\n\n"
        f"Thanks for applying to {course_name}. Your application is on file.\n\n"
        f"Programme fee: {amount}\n"
        f"Cohort: {cohort_label}\n"
        f"Pay from: {receipt_url}\n\n"
        f"Questions? Reply to this email or write to admission@vivacareeracademy.com.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<h2 style=\"color:#0B1F3A;margin:0 0 16px;\">Application received</h2>"
        f"<p>Hi {first},</p>"
        f"<p>{intro}</p>"
        f"<table style=\"border-collapse:collapse;margin:16px 0;font-size:14px;\">"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">Programme</td><td style=\"padding:6px 0;font-weight:700;\">{course_name}</td></tr>"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">Cohort</td><td style=\"padding:6px 0;font-weight:700;\">{cohort_label}</td></tr>"
        f"<tr><td style=\"padding:6px 14px 6px 0;color:#2f3140;\">{'Reservation advance' if is_reservation else 'Programme fee'}</td><td style=\"padding:6px 0;font-weight:700;\">{amount}</td></tr>"
        f"</table>"
        f"<p>{next_step}</p>"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{receipt_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">Open receipt &amp; pay</a>"
        f"</p>"
        f"<p style=\"color:#5a5040;font-size:13px;\">Questions? Reply to this email or write to "
        f"<a href=\"mailto:admission@vivacareeracademy.com\">admission@vivacareeracademy.com</a>.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}


def render_payment_link_ready_email(
    *,
    student_name: str,
    course_name: str,
    amount: float,
    payment_url: str,
    is_reservation: bool,
    currency: str = "INR",
) -> Dict[str, str]:
    """Sent when /applications/{id}/payment-link generates a Razorpay
    order. Useful so the student can pay from another device or share
    the link with a parent who's funding the fee."""
    first = _first_name(student_name)
    amount_str = _format_currency(amount, currency)
    label = "reservation advance" if is_reservation else "programme fee"
    subject = f"Payment link ready · {amount_str} · {course_name}"
    text = (
        f"Hi {first},\n\n"
        f"Your payment link for {course_name} is ready.\n\n"
        f"Amount: {amount_str} ({label})\n"
        f"Pay here: {payment_url}\n\n"
        f"The link is valid for 24 hours. If it expires, request a new one from /apply.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<h2 style=\"color:#0B1F3A;margin:0 0 16px;\">Payment link ready</h2>"
        f"<p>Hi {first},</p>"
        f"<p>Your payment link for <strong>{course_name}</strong> is ready. The {label} is "
        f"<strong>{amount_str}</strong>.</p>"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{payment_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">Pay now</a>"
        f"</p>"
        f"<p style=\"color:#5a5040;font-size:13px;\">The link is valid for 24 hours. If it expires, request a new one from the application page.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}


def render_test_passed_email(
    *,
    student_name: str,
    course_name: str,
    score_pct: float,
    verification_token: str,
) -> Dict[str, str]:
    """Sent the moment a student submits a test attempt and passes
    (auto-grade returns passed=true). Their certificate is issued in
    the same webhook; this email gives them the link."""
    first = _first_name(student_name)
    score = int(round(score_pct))
    cert_url = f"https://www.vivacareeracademy.com/certificates/{verification_token}"
    subject = f"You passed · certificate for {course_name}"
    text = (
        f"Hi {first},\n\n"
        f"Congratulations — you passed the {course_name} certification test "
        f"with a score of {score}%.\n\n"
        f"Your certificate has been issued. View, share, or print it from:\n"
        f"{cert_url}\n\n"
        f"This is a public verifiable URL — anyone (recruiters, employers) "
        f"can paste it into a browser to confirm the certificate is real.\n\n"
        f"Add it to your LinkedIn under Licenses & Certifications. The placement "
        f"team will reach out about your career-readiness window.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<div style=\"background:rgba(31,122,58,0.08);border-left:3px solid #1f7a3a;padding:14px 18px;margin-bottom:18px;\">"
        f"<div style=\"font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1f7a3a;font-weight:600;\">You passed</div>"
        f"<div style=\"margin-top:4px;font-size:18px;color:#0B1F3A;font-weight:700;\">Score: {score}%</div>"
        f"</div>"
        f"<p>Hi {first},</p>"
        f"<p>Congratulations — you passed the certification test for "
        f"<strong>{course_name}</strong> with a score of <strong>{score}%</strong>.</p>"
        f"<p>Your certificate has been issued. View, share, or print it:</p>"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{cert_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">View certificate</a>"
        f"</p>"
        f"<p style=\"color:#5a5040;font-size:13px;\">This is a public verifiable URL — anyone "
        f"(recruiters, employers) can paste it into a browser to confirm the certificate is real. "
        f"Add it to your LinkedIn under Licenses &amp; Certifications.</p>"
        f"<p>The placement team will reach out about your career-readiness window.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}


def render_test_failed_email(
    *,
    student_name: str,
    course_name: str,
    score_pct: float,
    pass_score: int,
    retake_after_iso: str,
) -> Dict[str, str]:
    """Sent when a test attempt is submitted with passed=false. Tells
    the student the retake date and reassures them their certificate
    is still issued (per the curriculum spec — placement guarantee
    requires pass score, but the certificate is awarded regardless)."""
    first = _first_name(student_name)
    score = int(round(score_pct))
    # Format retake date as 16 SEP 2026
    try:
        from datetime import datetime
        retake_dt = datetime.fromisoformat(retake_after_iso.replace("Z", "+00:00"))
        retake_pretty = retake_dt.strftime("%d %b %Y").upper()
    except (TypeError, ValueError):
        retake_pretty = "later"
    subject = f"Test result · {score}% · retake available on {retake_pretty}"
    text = (
        f"Hi {first},\n\n"
        f"You scored {score}% on the {course_name} certification test. "
        f"The pass mark is {pass_score}%, so you didn't clear it this time.\n\n"
        f"Good news: you can retake the test on or after {retake_pretty}. "
        f"Use the time to revisit the modules and weak areas — your trainer "
        f"can suggest specific chapters.\n\n"
        f"Your certificate of completion will still be issued, but the placement "
        f"guarantee requires {pass_score}% on the test.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<h2 style=\"color:#0B1F3A;margin:0 0 16px;\">Test result</h2>"
        f"<p>Hi {first},</p>"
        f"<p>You scored <strong>{score}%</strong> on the {course_name} certification test. "
        f"The pass mark is {pass_score}%, so you didn't clear it this time.</p>"
        f"<div style=\"background:rgba(244,180,0,0.10);border-left:3px solid #b8860b;padding:14px 18px;margin:18px 0;\">"
        f"<div style=\"font-weight:700;color:#0B1F3A;\">Retake available on {retake_pretty}</div>"
        f"<div style=\"margin-top:4px;color:#5a5040;font-size:13px;\">Use the time to revisit weak areas — your trainer can recommend specific chapters.</div>"
        f"</div>"
        f"<p style=\"color:#5a5040;font-size:13px;\">Your certificate of completion will still be issued, "
        f"but the placement guarantee requires {pass_score}% on the test.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}


def render_certificate_issued_email(
    *,
    student_name: str,
    course_name: str,
    verification_token: str,
    score_pct: Optional[float] = None,
) -> Dict[str, str]:
    """Sent when admin manually issues a certificate (waiver / backfill
    path). Auto-issued certs go through render_test_passed_email
    instead — this is for the 'admin clicked Issue manually' path."""
    first = _first_name(student_name)
    cert_url = f"https://www.vivacareeracademy.com/certificates/{verification_token}"
    score_line = f" with a score of {int(round(score_pct))}%" if score_pct is not None else ""
    subject = f"Your certificate is ready · {course_name}"
    text = (
        f"Hi {first},\n\n"
        f"Your certificate for {course_name} has been issued{score_line}.\n\n"
        f"View, share, or print it from:\n{cert_url}\n\n"
        f"Anyone with this URL (recruiters, employers) can verify the certificate is real.\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<h2 style=\"color:#0B1F3A;margin:0 0 16px;\">Your certificate is ready</h2>"
        f"<p>Hi {first},</p>"
        f"<p>Your certificate for <strong>{course_name}</strong> has been issued{score_line}.</p>"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{cert_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">View certificate</a>"
        f"</p>"
        f"<p style=\"color:#5a5040;font-size:13px;\">Anyone with this URL (recruiters, employers) can paste it into a browser to verify the certificate is real.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}


def render_trainer_feedback_email(
    *,
    student_name: str,
    chapter_title: str,
    outcome: str,
    trainer_feedback: str,
    score: Optional[float] = None,
    application_id: Optional[str] = None,
) -> Dict[str, str]:
    """Sent when a trainer creates a review for a chapter submission.
    Two flavours by outcome: 'pass' (cheerful — keep going) and
    'resubmit' (here's what to fix). Other outcomes use neutral copy."""
    first = _first_name(student_name)
    student_url = "https://www.vivacareeracademy.com/student"

    is_pass = outcome.lower() in {"pass", "passed", "approved"}
    is_resubmit = outcome.lower() in {"resubmit", "resubmission_required"}

    if is_pass:
        subject = f"Feedback on {chapter_title} · accepted"
        headline = "Submission accepted"
        body_intro = "Your trainer has reviewed and accepted your submission. Good work."
        accent_color = "#1f7a3a"
        accent_bg = "rgba(31,122,58,0.08)"
    elif is_resubmit:
        subject = f"Feedback on {chapter_title} · please resubmit"
        headline = "Resubmission requested"
        body_intro = (
            "Your trainer has reviewed your submission and requested a "
            "resubmission. Their notes are below — once you've revised, "
            "submit again from the chapter page."
        )
        accent_color = "#b8860b"
        accent_bg = "rgba(244,180,0,0.10)"
    else:
        subject = f"Feedback on {chapter_title}"
        headline = f"Outcome: {outcome}"
        body_intro = "Your trainer has left feedback on your submission. Details below."
        accent_color = "#0B1F3A"
        accent_bg = "rgba(11,31,58,0.06)"

    score_line = ""
    if score is not None:
        score_line = f"<div style=\"margin-top:4px;color:#5a5040;font-size:13px;\">Score: <strong>{int(round(score))}</strong></div>"

    feedback_block = ""
    if trainer_feedback:
        feedback_block = (
            f"<div style=\"margin:18px 0;padding:14px 18px;background:#fefcf6;border:1px solid #d8cfbe;border-radius:4px;\">"
            f"<div style=\"font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a5040;font-weight:600;\">Trainer notes</div>"
            f"<p style=\"margin:8px 0 0;font-size:14px;line-height:1.6;color:#111d23;\">{trainer_feedback}</p>"
            f"</div>"
        )

    text = (
        f"Hi {first},\n\n"
        f"{body_intro}\n\n"
        f"Chapter: {chapter_title}\n"
        f"Outcome: {outcome}\n"
        + (f"Score: {int(round(score))}\n" if score is not None else "")
        + (f"\nTrainer notes:\n{trainer_feedback}\n" if trainer_feedback else "")
        + f"\nOpen your dashboard: {student_url}\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<div style=\"background:{accent_bg};border-left:3px solid {accent_color};padding:14px 18px;margin-bottom:18px;\">"
        f"<div style=\"font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:{accent_color};font-weight:600;\">{headline}</div>"
        f"<div style=\"margin-top:4px;font-size:16px;color:#0B1F3A;font-weight:700;\">{chapter_title}</div>"
        f"{score_line}"
        f"</div>"
        f"<p>Hi {first},</p>"
        f"<p>{body_intro}</p>"
        f"{feedback_block}"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{student_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">Open dashboard</a>"
        f"</p>"
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


def render_module_unlocked_email(
    *,
    student_name: str,
    course_title: str,
    module_title: str,
    week_number: int,
    unlock_date: str,
    application_id: str,
) -> Dict[str, str]:
    """Sent on the morning a module becomes available to a student.

    Triggered by the daily `cron/unlock-modules` job. Idempotent — the cron
    marks `module_unlock_notified_at[module_id]` after sending so a re-run on
    the same day is a no-op.
    """
    first = _first_name(student_name)
    week_label = f"Week {int(week_number):02d}" if week_number else "your next module"
    workspace_url = f"https://www.vivacareeracademy.com/dashboard"
    subject = f"{week_label} is unlocked · {module_title}"
    text = (
        f"Hi {first},\n\n"
        f"{week_label} of {course_title} is now unlocked.\n\n"
        f"Module: {module_title}\n"
        f"Unlocked on: {unlock_date}\n\n"
        f"Open the module workspace to start the week's chapters and "
        f"submit your assignments before the next deadline.\n\n"
        f"{workspace_url}\n\n"
        f"— Viva Career Academy"
    )
    html = (
        f"<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;color:#111d23;max-width:560px;margin:0 auto;\">"
        f"<div style=\"background:rgba(184,134,11,0.10);border-left:3px solid #b8860b;padding:14px 18px;margin-bottom:18px;\">"
        f"<div style=\"font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6708;font-weight:600;\">Module unlocked</div>"
        f"<div style=\"margin-top:4px;font-size:18px;color:#0B1F3A;font-weight:700;\">{week_label} · {module_title}</div>"
        f"</div>"
        f"<p>Hi {first},</p>"
        f"<p><strong>{week_label}</strong> of <strong>{course_title}</strong> is now "
        f"available in your learner workspace.</p>"
        f"<p>This week's chapters, readings, and submission window are live as of "
        f"<strong>{unlock_date}</strong>. Submit your work before the deadline closes "
        f"to keep your progression on track and stay eligible for the placement guarantee.</p>"
        f"<p style=\"margin:18px 0;\">"
        f"<a href=\"{workspace_url}\" style=\"display:inline-block;background:#0B1F3A;color:#f5efe4;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600;\">Open module workspace</a>"
        f"</p>"
        f"<p style=\"color:#5a5040;font-size:13px;\">If you miss the deadline, the module re-locks "
        f"after a short grace period and a small penalty fee is needed to unlock it again. "
        f"Your trainer is happy to help if you're stuck — message them through the workspace.</p>"
        f"<p style=\"color:#2f3140;margin-top:24px;\">— Viva Career Academy</p>"
        f"</div>"
    )
    return {"subject": subject, "html": html, "text": text}
