# VIVA Academy Platform — Fix Log

**Client:** VIVA Career Academy (vivacareeracademy.com)  
**Team:** DigiBull AI  
**Repo:** https://github.com/vivattraining/viva-academy-platform

---

## Summary

QA audit found 68 issues (19.1% pass rate). This log tracks all P0/P1 fixes applied.

---

## Fixes Applied

### 2026-05-08 — Batch 1 (Initial fixes)

| # | Area | Type | Fix |
|---|------|------|-----|
| #25, #28, #31 | Backend | P0 | `main.py`: added `load_dotenv()` — JWT env vars were not loading, causing cascade auth failures |
| #29 | Security | P0 | `internal-access.ts`: removed Razorpay/Zoom JWT fallbacks; raised minimum secret length from 16 → 32 chars |
| #27, #59 | Auth | P0 | `auth.py`: replaced bare `"@"` email check with proper regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` in credential and login functions |
| #27, #59 | Auth | P0 | `academy.py`: same email regex fix applied to trainer invite endpoint |
| #20 | Admin | P0 | `academy.py`: blocked admin from changing their own role |
| #24 | Admissions | P0 | `admissions-workbench.tsx`: mark-enrolled now sends only `payment_stage=paid`, not all 3 states |
| #32 | Login UI | P0 | `operator-gate.tsx`: added `type="email"` to login email input |
| #8, #12, #23, #33, #37, #42 | Registration | P0 | `public-admissions-flow.tsx`: added `type="email"` on email, `type="tel"` on phone, `maxLength`, and regex validation for name/email/phone |
| #26 | Trainer Onboarding | P0 | `onboarding/trainer/page.tsx`: redirects to login if no token in URL |
| #22 | Registration | P0 | `store.py`: duplicate application guard — rejects re-submission with same email + course |

---

### 2026-05-12 — Batch 2

| # | Area | Type | Fix | Files Changed |
|---|------|------|-----|---------------|
| **#5** | API Security | P0 | All protected stub endpoints changed from `400 "Secure endpoint required"` → `401 "Authentication required. Use the /secure endpoint."` so HTTP clients correctly receive an Unauthorized response. Also removed internal `counts` object (application/batch/session counts) from the public `GET /tenants/{tenant_name}` response — it was leaking internal data without auth. | `apps/api/app/routers/academy.py` |
| **#8** | Registration Form | P0 | Phone validation tightened: now strips all non-digit characters first, then checks that 7–15 actual digits remain. Previously the regex counted dashes, spaces, and parentheses toward the character limit, allowing strings with no real digits to pass. | `apps/web/components/public-admissions-flow.tsx` |
| **#12** | Login | P0 | Both `StudentLoginPanel` and `OperatorGate` now validate email format (regex check) before calling the auth API. Previously only empty-string check was done, so malformed emails like `abc` or `test@` hit the backend on every keystroke submit. Email input in `StudentLoginPanel` also got `type="email"` and `autoComplete="email"`. | `apps/web/components/student-login-panel.tsx`, `apps/web/components/operator-gate.tsx` |

---

## Still Open

| # | Area | Description | Priority |
|---|------|-------------|----------|
| #21 | Trainer UI | Black text not visible in Trainer section (CSS contrast issue) | P0 |
| #34 | Applications | `GET /applications` returns 401 — QA was hitting wrong URL; real endpoint is `/applications/secure`. Frontend routing may need to point to correct URL. | P0 |
| #66 | Certificate | Certificate view throws error | P1 |
| #67 | Trainer | Trainer name not updating after admin edit | P1 |
| #68 | Navigation | Login not prominently visible on public pages | P0 |
| P2 | UI/UX | Various responsive layout and whitespace issues | P2 |

---

## Commit References

| Commit | Message |
|--------|---------|
| `c0d5bef` | Fix P0/P1 security and UX issues from QA audit (Batch 1) |
| `d70b2d4` | fixed_issues |
| `9b48ce5` | Fix P0 issues #5 #8 #12: API auth stubs, phone validation, login email check (Batch 2) |
