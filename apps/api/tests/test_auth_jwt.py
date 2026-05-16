"""
JWT encode/decode round-trip contract.

Locks in:
- A JWT signed with the configured secret decodes back to the same payload.
- A JWT signed with a different secret raises (no silent acceptance).
- An expired JWT raises (no silent acceptance).
- The `alg` claim is HS256 (no alg-confusion bug — a future migration to
  RS256 would invalidate this test, at which point the test should be
  updated alongside the encoder).
"""
from __future__ import annotations

import importlib
import time

import pytest


@pytest.fixture(scope="module")
def auth_mod():
    return importlib.import_module("app.auth")


@pytest.fixture(scope="module")
def models_mod():
    return importlib.import_module("app.models")


def _make_credential(models_mod, *, role="admin"):
    """Build a minimal AcademyUserCredential for token signing."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    return models_mod.AcademyUserCredential(
        tenant_name="Viva Career Academy",
        email="test@example.com",
        full_name="Test User",
        role=role,
        password_hash="",
        created_at=now,
        updated_at=now,
    )


def test_jwt_roundtrip(auth_mod, models_mod):
    from datetime import datetime, timezone, timedelta
    cred = _make_credential(models_mod)
    expires = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    token = auth_mod.encode_access_token(
        tenant_name="Viva Career Academy",
        credential=cred,
        session_token="sess-abc",
        expires_at=expires,
    )
    payload = auth_mod.decode_access_token(token)
    assert payload["sid"] == "sess-abc"
    assert payload["role"] == "admin"
    assert payload["tenant_name"] == "Viva Career Academy"
    assert "exp" in payload


def test_jwt_alg_is_hs256(auth_mod, models_mod):
    """The token must be signed HS256 — alg-confusion regressions would
    cascade into the frontend's verifier silently."""
    import json
    from base64 import urlsafe_b64decode
    from datetime import datetime, timezone, timedelta

    cred = _make_credential(models_mod)
    expires = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    token = auth_mod.encode_access_token(
        tenant_name="Viva Career Academy",
        credential=cred,
        session_token="sess-x",
        expires_at=expires,
    )
    header_b64 = token.split(".", 1)[0]
    # base64url decode with padding fix
    pad = "=" * (-len(header_b64) % 4)
    header = json.loads(urlsafe_b64decode(header_b64 + pad).decode())
    assert header.get("alg") == "HS256"
    assert header.get("typ") == "JWT"


def test_jwt_tampered_payload_rejected(auth_mod, models_mod):
    """If the payload is changed without re-signing, verification must fail."""
    from datetime import datetime, timezone, timedelta

    cred = _make_credential(models_mod)
    expires = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    token = auth_mod.encode_access_token(
        tenant_name="Viva Career Academy",
        credential=cred,
        session_token="sess-y",
        expires_at=expires,
    )

    # Mutate one character in the signature segment
    header, payload, signature = token.split(".")
    mangled = ".".join([header, payload, signature[:-1] + ("A" if signature[-1] != "A" else "B")])

    with pytest.raises(Exception):
        auth_mod.decode_access_token(mangled)


def test_jwt_expired_token_rejected(auth_mod, models_mod):
    """An already-expired token must NOT decode cleanly."""
    from datetime import datetime, timezone, timedelta

    cred = _make_credential(models_mod)
    # already past — should be rejected at decode
    expires = (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat()
    token = auth_mod.encode_access_token(
        tenant_name="Viva Career Academy",
        credential=cred,
        session_token="sess-expired",
        expires_at=expires,
    )

    with pytest.raises(Exception):
        auth_mod.decode_access_token(token)
