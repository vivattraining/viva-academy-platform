"""
Rate-limit window contract tests.

Locks in:
- _client_ip prefers x-vercel-forwarded-for over the raw x-forwarded-for
  (audit row H-B2, 16 May 2026 — XFF was previously spoofable)
- enforce() raises HTTPException 429 after `limit` requests within window
- enforce() does not raise inside the window when limit not exceeded
- Per-bucket isolation: bursting login does not affect cert-verify counters
"""
from __future__ import annotations

import importlib

import pytest


@pytest.fixture(scope="module")
def rate_limit_mod(monkeypatch_session):
    # We need the rate limiter to ACTUALLY enforce in tests, so override
    # the module's _ENFORCE flag after import.
    mod = importlib.import_module("app.rate_limit")
    monkeypatch_session.setattr(mod, "_ENFORCE", True, raising=True)
    # Clear bucket state between test runs to keep this hermetic.
    mod._buckets.clear()
    yield mod
    mod._buckets.clear()


# Session-scoped monkeypatch — pytest's built-in is function-scoped, so
# we roll our own.
@pytest.fixture(scope="module")
def monkeypatch_session():
    from _pytest.monkeypatch import MonkeyPatch
    mp = MonkeyPatch()
    yield mp
    mp.undo()


# ─── _client_ip ─────────────────────────────────────────────────────────

class _FakeRequest:
    """Minimal stand-in for starlette.Request — just headers + .client."""
    def __init__(self, headers: dict, client_host: str | None = None):
        # Starlette's Request.headers is case-insensitive — our code uses
        # .get("x-...") so a plain lowercase dict matches the contract.
        self.headers = {k.lower(): v for k, v in headers.items()}
        self.client = type("Client", (), {"host": client_host})() if client_host else None


def test_client_ip_prefers_vercel_header(rate_limit_mod):
    req = _FakeRequest(
        headers={"x-forwarded-for": "evil.attacker", "x-vercel-forwarded-for": "203.0.113.5"},
        client_host="10.0.0.1",
    )
    assert rate_limit_mod._client_ip(req) == "203.0.113.5"


def test_client_ip_falls_back_to_direct_client(rate_limit_mod):
    # Critical: with NO x-vercel-forwarded-for, we ignore x-forwarded-for
    # entirely (charter rule H-B2). An attacker can't bypass rate-limit
    # by rotating XFF when no Vercel edge is in front.
    req = _FakeRequest(
        headers={"x-forwarded-for": "1.2.3.4, 5.6.7.8"},
        client_host="10.0.0.1",
    )
    assert rate_limit_mod._client_ip(req) == "10.0.0.1"


def test_client_ip_unknown_when_no_signal(rate_limit_mod):
    req = _FakeRequest(headers={}, client_host=None)
    assert rate_limit_mod._client_ip(req) == "unknown"


def test_client_ip_strips_whitespace(rate_limit_mod):
    req = _FakeRequest(
        headers={"x-vercel-forwarded-for": "  203.0.113.7  "},
        client_host=None,
    )
    assert rate_limit_mod._client_ip(req) == "203.0.113.7"


# ─── enforce() window logic ─────────────────────────────────────────────

def test_enforce_allows_up_to_limit(rate_limit_mod):
    from fastapi import HTTPException
    req = _FakeRequest(headers={"x-vercel-forwarded-for": "10.0.0.10"})

    # 5 requests within window — none should raise.
    for _ in range(5):
        rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60)


def test_enforce_429_after_limit_exceeded(rate_limit_mod):
    from fastapi import HTTPException
    req = _FakeRequest(headers={"x-vercel-forwarded-for": "10.0.0.11"})

    for _ in range(5):
        rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60)

    with pytest.raises(HTTPException) as exc_info:
        rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60)
    assert exc_info.value.status_code == 429
    assert "Retry-After" in exc_info.value.headers


def test_enforce_buckets_are_isolated(rate_limit_mod):
    """Hitting the login bucket from one IP shouldn't affect the cert-verify bucket from the same IP."""
    req = _FakeRequest(headers={"x-vercel-forwarded-for": "10.0.0.12"})

    # Burn through login's limit
    for _ in range(5):
        rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60)

    # cert-verify from the same IP should still be allowed
    rate_limit_mod.enforce(req, bucket="cert-verify", limit=60, window_seconds=60)


def test_enforce_extra_key_isolates_per_email(rate_limit_mod):
    """
    The 'extra_key' parameter (e.g. login per-email) keeps one student's
    failed attempts from locking out another sharing the same NAT IP.
    """
    from fastapi import HTTPException

    req = _FakeRequest(headers={"x-vercel-forwarded-for": "10.0.0.13"})

    # Saturate login for student-A
    for _ in range(5):
        rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60, extra_key="a@example.com")
    with pytest.raises(HTTPException):
        rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60, extra_key="a@example.com")

    # Student-B from same IP must still be allowed
    rate_limit_mod.enforce(req, bucket="login", limit=5, window_seconds=60, extra_key="b@example.com")
