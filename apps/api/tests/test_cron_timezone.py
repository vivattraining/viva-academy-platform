"""
Cron session-window timezone contract.

Locks in the H-Q5 fix (16 May 2026): trainer-typed `session_date` +
`start_time` / `end_time` are interpreted in IST (Asia/Kolkata) and
converted to UTC for cron arithmetic. Previously they were treated as
UTC directly — a 5.5-hour misalignment masked by the +15 min grace.
"""
from __future__ import annotations

import importlib
from datetime import timezone


def test_ist_to_utc_basic():
    mod = importlib.import_module("app.routers.cron")
    row = {
        "session_date": "2026-05-16",
        "start_time": "21:00",      # 9:00 PM IST
        "end_time": "23:00",        # 11:00 PM IST
    }
    start, end = mod._parse_session_window(row)
    assert start is not None and end is not None
    # IST is UTC+5:30 — 21:00 IST = 15:30 UTC same day
    assert start.tzinfo is not None
    assert start.utcoffset().total_seconds() == 0  # converted to UTC
    assert (start.hour, start.minute) == (15, 30)
    assert (end.hour, end.minute) == (17, 30)
    assert start.date().isoformat() == "2026-05-16"


def test_early_morning_ist_crosses_to_previous_day_utc():
    mod = importlib.import_module("app.routers.cron")
    row = {
        "session_date": "2026-05-16",
        "start_time": "04:30",      # 4:30 AM IST
        "end_time": "06:30",        # 6:30 AM IST
    }
    start, end = mod._parse_session_window(row)
    # 04:30 IST = 23:00 UTC on the PREVIOUS day
    assert start is not None and end is not None
    assert start.hour == 23 and start.minute == 0
    assert start.date().isoformat() == "2026-05-15"
    # 06:30 IST = 01:00 UTC same UTC day
    assert end.hour == 1 and end.minute == 0
    assert end.date().isoformat() == "2026-05-16"


def test_missing_session_date_returns_nones():
    mod = importlib.import_module("app.routers.cron")
    assert mod._parse_session_window({}) == (None, None)
    assert mod._parse_session_window({"session_date": ""}) == (None, None)


def test_malformed_time_returns_none_for_that_slot():
    mod = importlib.import_module("app.routers.cron")
    start, end = mod._parse_session_window({
        "session_date": "2026-05-16",
        "start_time": "garbage",
        "end_time": "21:00",
    })
    assert start is None
    assert end is not None
    assert end.hour == 15 and end.minute == 30


def test_returned_datetimes_are_utc_naive_false():
    """Returned datetimes MUST be timezone-aware so they compare safely
    against datetime.now(timezone.utc) — naive datetimes silently fail."""
    mod = importlib.import_module("app.routers.cron")
    start, _ = mod._parse_session_window({
        "session_date": "2026-05-16",
        "start_time": "12:00",
        "end_time": "13:00",
    })
    assert start is not None
    assert start.tzinfo is not None
    assert start.tzinfo == timezone.utc or start.utcoffset().total_seconds() == 0
