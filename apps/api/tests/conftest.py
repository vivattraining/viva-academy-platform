"""
Pytest configuration for the VIVA API.

Closes Q-REF-2 from the 16 May 2026 internal audit: the backend had
zero unit tests. ~94 endpoints relied entirely on Playwright E2E coverage,
which only runs against deployed production and so can't catch a broken
import or a regex regression before merge.

Adds the bare-minimum scaffolding so any developer can run
`pytest` from `apps/api/` and get green output. Individual test modules
under `tests/` exercise the high-value pure-logic helpers (validators,
rate-limit window, cron timezone, JWT round-trip).

The DB-backed endpoint tests are intentionally OUT of scope for this PR
— they need a Postgres-or-sqlite fixture and a multi-tenant test seed,
both of which deserve their own dedicated PR.
"""
from __future__ import annotations

# ── Env-var setup MUST happen before any `app.*` import.
# `app.config.Settings` is a frozen dataclass instantiated at import time
# from `os.getenv(...)`. If we set env vars inside a fixture, the test runs
# after the module has already captured the wrong (empty) values. Setting
# them at conftest module load — which pytest runs before any test
# collection — guarantees `Settings` reads the test values.
import os
import sys
from pathlib import Path


os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("ACADEMY_JWT_SECRET", "test-secret-" + ("x" * 32))
os.environ.setdefault("ALLOW_DEMO_AUTH", "false")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("TENANT_NAME", "Viva Career Academy")


# Ensure `apps/api` is on sys.path so tests can do `from app.X import Y`
# whether they're invoked via `pytest` from inside apps/api or from repo root.
_API_DIR = Path(__file__).resolve().parent.parent
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))
