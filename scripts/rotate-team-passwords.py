#!/usr/bin/env python3
"""
Rotate (regenerate) passwords for accounts already provisioned by
provision-team-accounts.py. Use this if the original credential files were
lost, deleted, or you need to issue a new password for an existing user.

Reads the same CSV as the provisioning script (email, role, full_name).
Calls PATCH /api/v1/academy/auth/users/secure to set a new password for
each row, and writes the same per-user message file at team-credentials/.

Usage:
    python3 scripts/rotate-team-passwords.py scripts/team.csv

Auto-detects the master admin credentials from:
    ~/Desktop/KEEP - LIVE PROJECTS/VIVA-LAUNCH-CREDENTIALS-2026-04-26.md
or honors VIVA_ADMIN_CREDS_FILE if set.
"""

from __future__ import annotations

import csv
import getpass
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Reuse helpers from the provisioning script — keeps password generation,
# regex-based extraction, and message formatting in one source of truth.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib import import_module

provision = import_module("provision-team-accounts")  # noqa: E402

API_BASE = provision.API_BASE
TENANT_NAME = provision.TENANT_NAME
ALLOWED_ROLES = provision.ALLOWED_ROLES


def patch_user(session: dict, *, email: str, full_name: str, role: str, password: str) -> None:
    body = json.dumps(
        {
            "tenant_name": TENANT_NAME,
            "email": email,
            "full_name": full_name,
            "role": role,
            "password": password,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{API_BASE}/api/v1/academy/auth/users/secure",
        data=body,
        method="PATCH",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {session['access_token']}",
            "X-Academy-Session": session["session_token"],
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            response.read()
    except urllib.error.HTTPError as err:
        try:
            detail = json.loads(err.read()).get("detail", err.reason)
        except Exception:
            detail = err.reason
        raise RuntimeError(f"HTTP {err.code} {detail}") from None


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        sys.exit(f"CSV not found: {csv_path}")

    rows: list[dict[str, str]] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"email", "role", "full_name"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            sys.exit(f"CSV missing columns: {sorted(missing)}")
        for row in reader:
            email = (row.get("email") or "").strip().lower()
            role = (row.get("role") or "").strip().lower()
            full_name = (row.get("full_name") or "").strip()
            if not email or not role or not full_name:
                continue
            if role not in ALLOWED_ROLES:
                sys.exit(f"Invalid role {role!r} for {email}")
            rows.append({"email": email, "role": role, "full_name": full_name})

    if not rows:
        sys.exit("No usable rows in CSV.")

    print(f"Will ROTATE passwords for {len(rows)} account(s) at {API_BASE}.")
    for r in rows:
        print(f"  - {r['email']:<40} {r['role']:<12} {r['full_name']}")
    print()
    print("This regenerates passwords. Anyone using the OLD password will be locked out")
    print("(any active sessions for these accounts will also be revoked).")
    confirm = input("Proceed? [y/N] ").strip().lower()
    if confirm not in {"y", "yes"}:
        print("Aborted.")
        return 1

    print()

    # Auto-detect admin credentials.
    creds_paths = [
        os.environ.get("VIVA_ADMIN_CREDS_FILE", ""),
        os.path.expanduser("~/Desktop/KEEP - LIVE PROJECTS/VIVA-LAUNCH-CREDENTIALS-2026-04-26.md"),
    ]
    admin_email = ""
    admin_password = ""
    for candidate in creds_paths:
        if not candidate or not os.path.exists(candidate):
            continue
        try:
            content = Path(candidate).read_text(encoding="utf-8")
        except OSError:
            continue
        match = re.search(
            r"\|\s*admin\s*\|\s*([^\s|]+@[^\s|]+)\s*\|\s*`([^`]+)`",
            content,
        )
        if match:
            admin_email = match.group(1).strip().lower()
            admin_password = match.group(2)
            print(f"Auto-detected admin credentials from: {candidate}")
            break

    if not admin_email or not admin_password:
        print("Could not auto-detect admin credentials.")
        admin_email = input("Master admin email: ").strip().lower()
        admin_password = getpass.getpass("Master admin password (input hidden): ")
    print()

    print("Logging in as admin...")
    session = provision.login_admin(admin_email, admin_password)
    print(f"Logged in as {session['email']} (role={session['role']}).")
    print()

    rotated: list[Path] = []
    failed: list[tuple[str, str]] = []

    for row in rows:
        email = row["email"]
        new_password = provision.generate_password()
        try:
            patch_user(
                session,
                email=email,
                full_name=row["full_name"],
                role=row["role"],
                password=new_password,
            )
        except RuntimeError as err:
            failed.append((email, str(err)))
            continue
        path = provision.write_credential_file(email, row["full_name"], row["role"], new_password)
        rotated.append(path)
        print(f"  ✓ {email}  →  {path.relative_to(Path.cwd()) if path.is_relative_to(Path.cwd()) else path}")

    print()
    print(f"Rotated: {len(rotated)}")
    print(f"Failed:  {len(failed)}  {failed if failed else ''}")

    if rotated:
        print()
        print(f"Per-developer credential files: {provision.OUTPUT_DIR}")
        print("Open each file, copy the message, send it to the person, then DELETE the file.")

    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
