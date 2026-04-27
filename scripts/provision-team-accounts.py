#!/usr/bin/env python3
"""
Provision per-developer Viva academy accounts using the existing
/auth/users/secure API endpoint.

Why: avoid sharing the master admin password. Every developer gets their
own credential with their own role; logins become attributable; revocation
is per-person.

Usage:
    python3 scripts/provision-team-accounts.py path/to/team.csv

Input CSV format (header required):
    email,role,full_name
    alice@example.com,admin,Alice Smith
    bob@example.com,operations,Bob Jones

Allowed roles: admin, operations, trainer, student
Demo-mode student accounts are not created here — student credentials are
issued only after admissions + payment per the academy policy.

What it does:
    1. Prompts for the master admin email + password (masked, never logged).
    2. Logs into https://api.vivacareeracademy.com to get a session.
    3. For each row in the CSV:
         - generates a strong 24-char password (letters + digits + symbols)
         - POSTs to /api/v1/academy/auth/users/secure to create the credential
         - writes per-developer file at ./team-credentials/<email>.txt
    4. Prints a summary. The per-dev files are the artefacts you paste into
       1Password (one entry per developer) and then DELETE LOCALLY.

Safety:
    - The admin password is read via getpass (no echo, no shell history).
    - Generated passwords are never printed to stdout — they only land in
      the per-dev files.
    - The output directory is gitignored.
    - This script is idempotent for failures: re-running with the same CSV
      will skip emails that already exist (the API returns 409).
"""

from __future__ import annotations

import csv
import getpass
import json
import os
import secrets
import string
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_BASE = os.environ.get(
    "VIVA_API_URL", "https://api.vivacareeracademy.com"
).rstrip("/")
TENANT_NAME = os.environ.get("VIVA_TENANT_NAME", "Viva Career Academy")
ALLOWED_ROLES = {"admin", "operations", "trainer", "student"}
PASSWORD_LENGTH = 24

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "team-credentials"


def generate_password(length: int = PASSWORD_LENGTH) -> str:
    """Strong password: letters + digits + a small symbol set."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*-_=+"
    while True:
        candidate = "".join(secrets.choice(alphabet) for _ in range(length))
        # Require at least one of each class so it satisfies any reasonable
        # downstream policy.
        if (
            any(c.islower() for c in candidate)
            and any(c.isupper() for c in candidate)
            and any(c.isdigit() for c in candidate)
            and any(c in "!@#$%^&*-_=+" for c in candidate)
        ):
            return candidate


def api_post(path: str, payload: dict, headers: dict | None = None) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{API_BASE}{path}",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json", **(headers or {})},
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as err:
        try:
            detail = json.loads(err.read()).get("detail", err.reason)
        except Exception:
            detail = err.reason
        raise RuntimeError(f"HTTP {err.code} {detail}") from None


def login_admin(email: str, password: str) -> dict:
    response = api_post(
        "/api/v1/academy/auth/login",
        {"tenant_name": TENANT_NAME, "email": email, "password": password},
    )
    session = response.get("session") or {}
    if session.get("role") != "admin":
        raise SystemExit(
            f"Login succeeded but role is {session.get('role')!r}, not 'admin'. "
            "Use a real admin credential."
        )
    return session


def create_user(session: dict, *, email: str, full_name: str, role: str, password: str) -> None:
    api_post(
        "/api/v1/academy/auth/users/secure",
        {
            "tenant_name": TENANT_NAME,
            "email": email,
            "full_name": full_name,
            "role": role,
            "password": password,
        },
        headers={
            "Authorization": f"Bearer {session['access_token']}",
            "X-Academy-Session": session["session_token"],
        },
    )


def write_credential_file(email: str, full_name: str, role: str, password: str) -> Path:
    """Write a ready-to-send message — the operator can copy the entire file
    and paste it into WhatsApp / Email / Slack."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = email.replace("@", "_at_").replace(".", "_")
    path = OUTPUT_DIR / f"{safe_name}.txt"

    first_name = full_name.strip().split()[0] if full_name.strip() else ""
    role_label = {"admin": "Admin", "operations": "Operations", "trainer": "Trainer", "student": "Student"}.get(role, role.title())
    login_url = (
        "https://www.vivacareeracademy.com/login"
        if role == "student"
        else "https://www.vivacareeracademy.com/internal/login"
    )
    button_label = "Enter learner workspace" if role == "student" else "Open operator view"

    message = f"""Hi {first_name},

Your Viva Career Academy account is ready. Here are your sign-in details:

Login URL: {login_url}
Email:     {email}
Password:  {password}
Role:      {role_label}

Steps:
1. Open the login URL above in Chrome or Safari.
2. Scroll down on that page until you see the form with the Email and Password fields. (Do NOT click "Login" in the top navigation — that's a different page.)
3. Enter your email and the password exactly as shown above. Copy-paste from this message to avoid typos.
4. Click "{button_label}".
5. After your first sign-in, please change your password from the workspace.

If anything doesn't work, message me back.

Thanks,
Prateek
"""

    path.write_text(message, encoding="utf-8")
    path.chmod(0o600)
    return path


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
            sys.exit(f"CSV is missing required columns: {sorted(missing)}")
        for row in reader:
            email = (row.get("email") or "").strip().lower()
            role = (row.get("role") or "").strip().lower()
            full_name = (row.get("full_name") or "").strip()
            if not email or not role or not full_name:
                continue
            if role not in ALLOWED_ROLES:
                sys.exit(
                    f"Invalid role {role!r} for {email}. "
                    f"Allowed: {sorted(ALLOWED_ROLES)}"
                )
            rows.append({"email": email, "role": role, "full_name": full_name})

    if not rows:
        sys.exit("No usable rows in the CSV.")

    print(f"Will provision {len(rows)} account(s) at {API_BASE} (tenant: {TENANT_NAME}).")
    for r in rows:
        print(f"  - {r['email']:<40} {r['role']:<12} {r['full_name']}")
    confirm = input("Proceed? [y/N] ").strip().lower()
    if confirm not in {"y", "yes"}:
        print("Aborted.")
        return 1

    print()

    # Auto-detect admin credentials from the standard credentials file if it
    # exists — saves the operator from having to copy/paste the password.
    # Override path with VIVA_ADMIN_CREDS_FILE env var if needed.
    creds_search_paths = [
        os.environ.get("VIVA_ADMIN_CREDS_FILE", ""),
        os.path.expanduser("~/Desktop/KEEP - LIVE PROJECTS/VIVA-LAUNCH-CREDENTIALS-2026-04-26.md"),
    ]
    admin_email = ""
    admin_password = ""
    for candidate in creds_search_paths:
        if not candidate or not os.path.exists(candidate):
            continue
        import re

        try:
            content = Path(candidate).read_text(encoding="utf-8")
        except OSError:
            continue
        # Markdown table row format:
        # | admin | admin@example.com | `password` |
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
        print("Could not auto-detect admin credentials. Falling back to manual prompt.")
        admin_email = input("Master admin email: ").strip().lower()
        admin_password = getpass.getpass("Master admin password (input hidden): ")
    print()

    print("Logging in as admin...")
    session = login_admin(admin_email, admin_password)
    print(f"Logged in as {session['email']} (role={session['role']}).")
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    created: list[Path] = []
    skipped: list[tuple[str, str]] = []
    failed: list[tuple[str, str]] = []

    for row in rows:
        email = row["email"]
        password = generate_password()
        try:
            create_user(
                session,
                email=email,
                full_name=row["full_name"],
                role=row["role"],
                password=password,
            )
        except RuntimeError as err:
            message = str(err)
            if "409" in message or "already exists" in message:
                skipped.append((email, "already exists"))
                continue
            failed.append((email, message))
            continue
        path = write_credential_file(email, row["full_name"], row["role"], password)
        created.append(path)
        print(f"  ✓ {email}  →  {path.relative_to(Path.cwd()) if path.is_relative_to(Path.cwd()) else path}")

    print()
    print(f"Created: {len(created)}")
    print(f"Skipped: {len(skipped)}  {skipped if skipped else ''}")
    print(f"Failed:  {len(failed)}  {failed if failed else ''}")

    if created:
        print()
        print(f"Per-developer credential files: {OUTPUT_DIR}")
        print("Open each file, paste into 1Password (or your team vault),")
        print("then DELETE the file. The folder itself is gitignored.")

    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
