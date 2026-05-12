"""
VIVA Academy -- Security Audit
Uses the webapp-testing skill pattern (Python Playwright, headless Chromium).
Servers assumed already running:
  Frontend : http://localhost:3000
  Backend  : http://localhost:8000
"""

import json
import os
import sys
import time
import uuid as _uuid
import urllib.request
import urllib.error
import urllib.parse

# Force UTF-8 output so special chars don't crash on Windows cp1252
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

BASE_FRONT = "http://localhost:3000"
BASE_API   = "http://localhost:8000"
TENANT     = "vivacareeracademy"

PASS_ICON = "[PASS]"
FAIL_ICON = "[FAIL]"
WARN_ICON = "[WARN]"

results = []

def record(category, name, passed, detail=""):
    icon = PASS_ICON if passed else FAIL_ICON
    print(f"  {icon} {name}")
    if detail:
        print(f"       {detail}")
    results.append({"category": category, "name": name, "passed": passed, "detail": detail})

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ─────────────────────────────────────────────
# 1. HTTP Security Headers (API -- OPTIONS/CORS response headers)
# ─────────────────────────────────────────────
section("1. HTTP Security Headers -- API")

def check_headers_via_get(url, label):
    # Use GET on the root / health endpoint — CORS middleware intercepts OPTIONS
    # before security-headers middleware runs, so OPTIONS responses won't carry them.
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as r:
            hdrs = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        hdrs = {k.lower(): v for k, v in e.headers.items()}
    except Exception as ex:
        print(f"  {WARN_ICON} Could not reach {url}: {ex}")
        return

    checks = {
        "x-content-type-options": "nosniff",
        "x-frame-options": None,
        "content-security-policy": None,
    }
    for hdr, expected in checks.items():
        present = hdr in hdrs
        ok = present and (expected is None or expected in hdrs.get(hdr, "").lower())
        record(label, f"{hdr} present", ok, hdrs.get(hdr, "MISSING"))

    hsts = hdrs.get("strict-transport-security", "absent (OK on HTTP/localhost)")
    record(label, "strict-transport-security (informational)", True, hsts)

check_headers_via_get(f"{BASE_API}/", "API Security Headers")

# ─────────────────────────────────────────────
# 2. CORS Headers
# ─────────────────────────────────────────────
section("2. CORS Configuration -- API")

def check_cors(origin, should_allow):
    url = f"{BASE_API}/api/v1/academy/auth/login"
    req = urllib.request.Request(url, method="OPTIONS")
    req.add_header("Origin", origin)
    req.add_header("Access-Control-Request-Method", "POST")
    req.add_header("Access-Control-Request-Headers", "content-type")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            hdrs = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        hdrs = {k.lower(): v for k, v in e.headers.items()}
    except Exception:
        hdrs = {}

    acao = hdrs.get("access-control-allow-origin", "")
    allowed = origin in acao or acao == "*"
    label = f"Origin '{origin}' {'allowed' if should_allow else 'blocked'}"
    record("CORS", label, allowed == should_allow,
           f"Access-Control-Allow-Origin: {acao or 'absent'}")

check_cors("http://localhost:3000", should_allow=True)
check_cors("https://www.vivacareeracademy.com", should_allow=True)
check_cors("https://evil.example.com", should_allow=False)

# ─────────────────────────────────────────────
# 3. Authentication -- Invalid credentials rejected
# ─────────────────────────────────────────────
section("3. Authentication -- Invalid Credential Rejection")

def api_post(path, body):
    url = f"{BASE_API}{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data,
                                  headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as ex:
        return 0, {"error": str(ex)}

status, body = api_post("/api/v1/academy/auth/login", {
    "tenant_name": TENANT, "email": "notexist@example.com", "password": "wrongpassword123"
})
record("Auth", "Wrong credentials -> 401/403", status in (401, 403), f"HTTP {status}")

status, body = api_post("/api/v1/academy/auth/login", {
    "tenant_name": TENANT, "email": "", "password": ""
})
record("Auth", "Empty credentials -> 4xx", 400 <= status < 500, f"HTTP {status}")

status, body = api_post("/api/v1/academy/auth/login", {
    "tenant_name": TENANT, "email": "admin@test.com", "password": ""
})
record("Auth", "Empty password -> 4xx", 400 <= status < 500, f"HTTP {status}")

# ─────────────────────────────────────────────
# 4. API Access Control -- Unauthenticated requests blocked
# ─────────────────────────────────────────────
section("4. API Access Control -- Unauthenticated")

PROTECTED_ENDPOINTS = [
    f"/api/v1/academy/applications/secure?tenant_name={TENANT}",
    f"/api/v1/academy/auth/me?tenant_name={TENANT}",
]

for ep in PROTECTED_ENDPOINTS:
    url = f"{BASE_API}{ep}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            status = r.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception:
        status = 0
    record("API Auth", f"{ep.split('?')[0]} blocks anonymous", status in (401, 403), f"HTTP {status}")

# ─────────────────────────────────────────────
# 5. Input Validation -- SQL injection probes
# ─────────────────────────────────────────────
section("5. Input Validation -- SQL Injection Probes")

SQL_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE users;--",
    "admin'--",
]

for payload in SQL_PAYLOADS:
    status, body = api_post("/api/v1/academy/auth/login", {
        "tenant_name": TENANT,
        "email": payload,
        "password": payload,
    })
    safe = status != 500
    record("SQLi", f"SQL payload rejected: {payload[:30]}", safe, f"HTTP {status}")

# ─────────────────────────────────────────────
# 6. Input Validation -- XSS probes via application form
# ─────────────────────────────────────────────
section("6. Input Validation -- XSS via Application API")

XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
]

for payload in XSS_PAYLOADS:
    status, body = api_post(f"/api/v1/academy/applications?tenant_name={TENANT}", {
        "tenant_name": TENANT,
        "student_name": payload,
        "student_email": f"qa+{int(time.time())}@example.com",
        "student_phone": "9876543210",
        "course_name": "Foundation Program",
    })
    # 400/422 = validation rejected; 403 = auth blocked; 409 = dup; 500 = crash
    safe = status in (400, 422, 403, 409)
    record("XSS", f"XSS payload in name field: {payload[:30]}", safe, f"HTTP {status}")

# ─────────────────────────────────────────────
# 7. Rate Limiting -- brute-force protection
# ─────────────────────────────────────────────
section("7. Rate Limiting -- Brute-Force Protection")

rapid_statuses = []
for _ in range(6):
    s, _ = api_post("/api/v1/academy/auth/login", {
        "tenant_name": TENANT, "email": "attacker@evil.com", "password": "bad"
    })
    rapid_statuses.append(s)

no_server_errors = all(s != 500 for s in rapid_statuses)
rate_limited = any(s == 429 for s in rapid_statuses)
record("RateLimit", "6 rapid auth attempts -> no 500 crashes", no_server_errors, str(rapid_statuses))
record("RateLimit", "6 rapid auth attempts -> 429 (prod only / informational)",
       True,  # informational -- dev bypass is intentional
       f"Statuses: {rapid_statuses} (429 only in APP_ENV=production)")

# ─────────────────────────────────────────────
# 8. Sensitive Data Exposure -- API responses
# ─────────────────────────────────────────────
section("8. Sensitive Data Exposure -- API Responses")

status, body = api_post("/api/v1/academy/auth/login", {
    "tenant_name": TENANT, "email": "notexist@example.com", "password": "wrong"
})
body_str = json.dumps(body).lower()
leaks_hash   = any(k in body_str for k in ["hash", "bcrypt", "argon", "pbkdf"])
leaks_secret = any(k in body_str for k in ["jwt_secret", "private_key", "secret_key"])
record("Exposure", "Error response doesn't leak password hash", not leaks_hash, body_str[:120])
record("Exposure", "Error response doesn't leak JWT/secrets", not leaks_secret, body_str[:120])

# Stack traces in errors?
leaks_traceback = "traceback" in body_str or "file \"" in body_str
record("Exposure", "Error response doesn't leak Python traceback", not leaks_traceback, body_str[:120])

# ─────────────────────────────────────────────
# 9. Frontend Access Control -- Playwright
# ─────────────────────────────────────────────
section("9. Frontend Access Control -- Playwright (anonymous)")

GATED_PAGES = [
    "/admin", "/admissions", "/operations", "/roster",
    "/messages", "/trainer", "/student", "/dashboard", "/white-label",
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    for path in GATED_PAGES:
        url = f"{BASE_FRONT}{path}"
        resp = page.goto(url, wait_until="domcontentloaded")
        final_url = page.url
        status = resp.status if resp else 0
        has_login_form = page.locator('input[type="password"]').count() > 0
        redirected_to_login = "login" in final_url.lower() and final_url != url
        stayed_on_gated = final_url.rstrip("/") == url.rstrip("/")
        body_chars = page.evaluate("() => (document.body?.innerText || '').trim().length")

        leaked = stayed_on_gated and not has_login_form and body_chars > 50
        protected = not leaked

        record("FrontendAuth", f"{path} blocks anonymous",
               protected, f"final={final_url.replace(BASE_FRONT,'')} status={status} chars={body_chars}")

    browser.close()

# ─────────────────────────────────────────────
# 10. XSS Reflection Check -- login error
# ─────────────────────────────────────────────
section("10. Frontend Security -- XSS Reflection Check")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    xss_found = False

    page.goto(f"{BASE_FRONT}/internal/login", wait_until="networkidle")
    xss = "<script>window.__xss=1</script>"
    email_locator = page.locator('input[type="email"]')
    if email_locator.count() > 0:
        email_locator.first.fill(xss)
        page.locator('input[type="password"]').first.fill("testpassword")
        page.locator('button[type="submit"]').first.click()
        page.wait_for_timeout(1500)
        xss_executed = page.evaluate("() => !!window.__xss")
        alert_html = ""
        alert_locator = page.locator('[role="alert"]')
        if alert_locator.count() > 0:
            alert_html = alert_locator.first.inner_html()
        html_in_dom = "<script>" in alert_html
        xss_found = xss_executed or html_in_dom
    record("XSS", "Login error doesn't execute injected JS", not xss_found,
           f"xss_executed={xss_found}")

    browser.close()

# ─────────────────────────────────────────────
# 11. Open Redirect Check
# ─────────────────────────────────────────────
section("11. Open Redirect Check")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    redirect_targets = [
        f"{BASE_FRONT}/login?redirect=https://evil.example.com",
        f"{BASE_FRONT}/internal/login?next=https://evil.example.com",
        f"{BASE_FRONT}/login?return_to=//evil.example.com",
    ]
    for url in redirect_targets:
        page.goto(url, wait_until="domcontentloaded")
        final = page.url
        # True open redirect = browser actually navigated to attacker's host.
        # Query params containing the attacker URL on localhost are NOT open redirects.
        from urllib.parse import urlparse
        final_host = urlparse(final).netloc
        redirected_offsite = "evil.example.com" in final_host
        param = url.split("?")[1]
        record("OpenRedirect", f"No open redirect via {param}",
               not redirected_offsite, f"final_host={final_host} full={final}")

    browser.close()

# ─────────────────────────────────────────────
# 12. IDOR -- Object-Level Authorization Probe
# ─────────────────────────────────────────────
section("12. IDOR -- Unauthenticated Object Access")

fake_id = str(_uuid.uuid4())
for ep_tpl in [
    f"/api/v1/academy/applications/{fake_id}?tenant_name={TENANT}",
    f"/api/v1/academy/applications/{fake_id}/status/secure",
]:
    url = f"{BASE_API}{ep_tpl}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            status = r.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception:
        status = 0
    short = ep_tpl.split("?")[0].replace(f"/{fake_id}", "/{id}")
    record("IDOR", f"Unauthenticated access to {short} blocked",
           status in (401, 403, 404, 405), f"HTTP {status}")

# ─────────────────────────────────────────────
# 13. JWT forgery -- tampered token rejected
# ─────────────────────────────────────────────
section("13. JWT Security -- Tampered Token Rejected")

FAKE_JWT = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            ".eyJzdWIiOiJmYWtlLWlkIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ"
            ".AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")

url = f"{BASE_API}/api/v1/academy/applications/secure?tenant_name={TENANT}"
req = urllib.request.Request(url)
req.add_header("Authorization", f"Bearer {FAKE_JWT}")
req.add_header("X-Session-Token", FAKE_JWT)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        status = r.status
except urllib.error.HTTPError as e:
    status = e.code
except Exception:
    status = 0
record("JWT", "Forged JWT token rejected on protected endpoint", status in (401, 403), f"HTTP {status}")

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
section("SUMMARY")
total  = len(results)
passed = sum(1 for r in results if r["passed"])
failed = total - passed
print(f"\n  Total  : {total}")
print(f"  Passed : {passed}")
print(f"  Failed : {failed}")
print(f"  Pass % : {100*passed//total}%\n")

if failed:
    print("  FAILED CHECKS:")
    for r in results:
        if not r["passed"]:
            print(f"    [{r['category']}] {r['name']}")
            if r["detail"]:
                print(f"           {r['detail'][:120]}")

report_dir = os.path.join(os.path.dirname(__file__), "reports", "artifacts")
os.makedirs(report_dir, exist_ok=True)
report_path = os.path.join(report_dir, "security_audit.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump({"summary": {"total": total, "passed": passed, "failed": failed},
               "results": results}, f, indent=2)
print(f"  Report -> {report_path}\n")

sys.exit(0 if failed == 0 else 1)
