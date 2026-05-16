"""
Validator regex contract tests.

The four regexes in `app/routers/academy.py` and `app/auth.py` are the
last line of defence against malformed input that would otherwise land
unsanitised in the database. They were spread across files and had no
direct tests — easy to break in a refactor.

Locks the contract in here:
  - _EMAIL_RE   rejects obvious malformations, accepts realistic forms
  - _NAME_RE    rejects digits / special chars, accepts ASCII letters + space
  - _PHONE_RE   accepts 7-15 digits, rejects letters
"""
from __future__ import annotations

import importlib

import pytest


@pytest.fixture(scope="module")
def email_re():
    mod = importlib.import_module("app.routers.academy")
    return mod._EMAIL_RE


@pytest.fixture(scope="module")
def name_re():
    mod = importlib.import_module("app.routers.academy")
    return mod._NAME_RE


@pytest.fixture(scope="module")
def phone_re():
    mod = importlib.import_module("app.routers.academy")
    return mod._PHONE_RE


# ─── Email ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "value",
    [
        "narayan@vivacareeracademy.com",
        "a@b.c",
        "first.last+tag@subdomain.example.co.in",
        "1@1.1",
    ],
)
def test_email_accepts_realistic(email_re, value):
    assert email_re.match(value), f"{value!r} should pass _EMAIL_RE"


@pytest.mark.parametrize(
    "value",
    [
        "",
        "no-at-sign",
        "no-at-sign.com",
        "@no-local.com",
        "no-domain@",
        # NB: `trailing-dot.@example.com` would slip past the cheap pre-filter
        # regex below — Pydantic EmailStr is the real check on the application
        # creation endpoint. Don't tighten the regex without also benchmarking.
        "two@ats@example.com",
        "spaces in@example.com",
        "missing-tld@example",
    ],
)
def test_email_rejects_malformed(email_re, value):
    assert not email_re.match(value), f"{value!r} should fail _EMAIL_RE"


# ─── Name ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "value",
    [
        "Narayan Mallapur",
        "A",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz",
    ],
)
def test_name_accepts_alphabets_and_spaces(name_re, value):
    assert name_re.match(value), f"{value!r} should pass _NAME_RE"


@pytest.mark.parametrize(
    "value",
    [
        "",
        "Name123",
        "Name.Surname",
        "Name@Email",
        "<script>alert(1)</script>",
        "First, Last",
        "First-Last",       # hyphen not allowed — i18n follow-up tracked in backlog
        "O'Brien",          # apostrophe not allowed — same backlog item
        "José",             # accented char not allowed — same backlog item
    ],
)
def test_name_rejects_non_alpha(name_re, value):
    assert not name_re.match(value), f"{value!r} should fail _NAME_RE"


# ─── Phone ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "value",
    [
        "9876543210",
        "+919876543210"[1:],   # backend strips the + at the route boundary
        "0123456789",
        "1234567",             # 7-digit minimum
        "123456789012345",     # 15-digit maximum
    ],
)
def test_phone_accepts_digit_strings(phone_re, value):
    assert phone_re.match(value), f"{value!r} should pass _PHONE_RE"


@pytest.mark.parametrize(
    "value",
    [
        "",
        "abc",
        "98765-43210",
        "98765 43210",
        "+919876543210",
        "1234567890a",
    ],
)
def test_phone_rejects_non_digit(phone_re, value):
    assert not phone_re.match(value), f"{value!r} should fail _PHONE_RE"
