"""
Simple in-memory rate limiter for sensitive endpoints.

Closes security audit finding #3: login, bootstrap, cert verify, and
payment-link endpoints had no throttling. This module provides a
small dependency that buckets requests by (route, key) and rejects
with 429 once a per-window cap is exceeded.

Trade-off: in-memory means it doesn't share state across multiple
serverless instances. With Vercel's Python serverless this is
acceptable for the May launch (low concurrency, short windows
catch single-IP attackers). Post-launch, swap the backend to Redis
(via Upstash, already a dependency) for cluster-wide enforcement —
the API surface here doesn't change.
"""

from __future__ import annotations

import os
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Optional

from fastapi import HTTPException, Request

# Skip rate limiting in non-production environments (dev, CI, test runs).
_ENFORCE = os.getenv("APP_ENV", "production") == "production"

# Per-key sliding-window timestamps, keyed by (bucket, key).
# Bucket is e.g. "login", "cert-verify", "payment-link".
_lock = threading.Lock()
_buckets: dict[tuple[str, str], Deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    """Best-effort client IP — Vercel-aware, spoof-resistant.

    The naive `x-forwarded-for[0]` approach is trivially defeatable: any
    caller can prepend their own value to XFF and mint a fresh rate-limit
    bucket per request. Audit row H-B2 (16 May 2026).

    Vercel injects its OWN single-value `x-vercel-forwarded-for` header
    after edge termination — it carries the real client IP, with no
    comma-list form to slice and no path for an external caller to forge
    (the edge strips client-supplied versions). When that header is
    present, trust it. Otherwise fall back to `request.client.host` so
    attackers can't rotate `x-forwarded-for` to bypass the cap.

    See also backlog #48 (move rate-limit state from in-memory dict to
    Redis) — until then this is the strongest defence the per-process
    bucket can carry.
    """
    vercel_real_ip = request.headers.get("x-vercel-forwarded-for", "").strip()
    if vercel_real_ip:
        return vercel_real_ip
    if request.client:
        return request.client.host
    return "unknown"


def enforce(
    request: Request,
    *,
    bucket: str,
    limit: int,
    window_seconds: int,
    extra_key: Optional[str] = None,
) -> None:
    """Reject the request with 429 if the bucket+key has exceeded `limit`
    within the last `window_seconds`. Otherwise records the timestamp.

    `extra_key` lets callers narrow the bucket further — e.g. login
    rate-limits per (IP, email) so an attacker can't exhaust one
    account's quota by spraying from different IPs (the per-IP bucket
    catches that) AND so legitimate retries from a shared NAT don't
    knock out other users (the per-email bucket catches that).
    """
    if not _ENFORCE:
        return
    ip = _client_ip(request)
    composite = f"{ip}:{extra_key}" if extra_key else ip
    key = (bucket, composite)
    now = time.monotonic()
    cutoff = now - window_seconds

    with _lock:
        timestamps = _buckets[key]
        # Drop expired entries from the left.
        while timestamps and timestamps[0] < cutoff:
            timestamps.popleft()
        if len(timestamps) >= limit:
            retry_after = max(1, int(timestamps[0] + window_seconds - now))
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )
        timestamps.append(now)


# Convenience presets — call from endpoints with `enforce(...)`
LIMITS = {
    "login": (5, 900),           # 5 attempts / 15 min — credential stuffing defense
    "bootstrap": (3, 3600),      # 3 attempts / hour — admin bootstrap is rare
    "cert-verify": (60, 60),     # 60 RPM — public verify, modest cap
    "payment-link": (10, 60),    # 10 RPM — payment-link generation per IP
    "applications": (10, 60),    # 10 RPM — application submission per IP
}


def enforce_preset(request: Request, preset: str, *, extra_key: Optional[str] = None) -> None:
    if preset not in LIMITS:
        raise ValueError(f"Unknown rate-limit preset: {preset}")
    limit, window = LIMITS[preset]
    enforce(request, bucket=preset, limit=limit, window_seconds=window, extra_key=extra_key)
