# Viva Career Academy — QA Fixes Report

**Date:** 15 May 2026  
**Platform:** Viva Career Academy (Next.js 14 + FastAPI)  
**Total Issues Fixed:** 20  

---

## Summary

| Category | Fixed |
|---|---|
| UI / Layout | 8 |
| Functionality | 7 |
| Security / API | 2 |
| Mobile / Responsive | 2 |
| Build / Runtime Errors | 2 (additional) |
| **Total** | **20+** |

---

## Fixed Issues

---

### Issue #1 — Top Navbar: Single Line at All Viewport Sizes
**Category:** UI · **Priority:** P2

**Problem:**  
Top navbar elements wrapped onto a second line at 1366px and 14" laptop viewports (100% zoom). "Advisory Board" link was breaking onto a new line.

**Fix Applied:**
- Added `flex-wrap: nowrap` and `white-space: nowrap` to `.navLinks` and nav link items
- Reduced nav link gap from 32px to 24px
- Added intermediate `@media (max-width: 1280px)` breakpoint reducing font size to 13px and gap to 18px

**Files Modified:** `apps/web/components/claude-home.module.css`

---

### Issue #2 — Programs Grid: Metadata on Same Line
**Category:** UI · **Priority:** P2

**Problem:**  
In the programs grid cards, Duration, Format and Next Cohort values were displayed in a distorted stacked layout instead of a clean single line.

**Fix Applied:**
- Created `.metaInline` flex row class with `.metaSep` separator (·) between items
- Duration, Format and Next Cohort now appear on one line inside every program card

**Files Modified:** `apps/web/components/claude-home.module.css`, `apps/web/app/page.tsx` (claude-home.tsx)

---

### Issue #6 — Registration Form: Step Button Locked After Submit
**Category:** Functionality · **Priority:** P2

**Problem:**  
After completing Stage 1 of the application form, the submit button remained clickable even without any changes. Users could submit the same stage multiple times.

**Fix Applied:**
- Added `step1Submitted` state flag — set to `true` after a successful Stage 1 submit
- Submit button is disabled once `step1Submitted` is true
- Any field change resets `step1Submitted` to false, re-enabling the button
- Same pattern applied to each subsequent stage

**Files Modified:** `apps/web/components/public-admissions-flow.tsx`

---

### Issue #7 — Footer: No Whitespace at Bottom
**Category:** UI · **Priority:** P2

**Problem:**  
Footer had excessive whitespace below it caused by inheriting a large `clamp(64px, 8vw, 110px)` bottom padding from the shared section class.

**Fix Applied:**
- Added explicit `.footer { padding-bottom: 40px }` override to neutralise the inherited clamp value

**Files Modified:** `apps/web/components/claude-home.module.css`

---

### Issue #9 — Contact Page: Proper Grid Spacing
**Category:** UI · **Priority:** P2

**Problem:**  
Contact page grid elements and headings were sticking to the screen edges with no horizontal padding or max-width constraint.

**Fix Applied:**
- Wrapped all contact page sections inside `<div className={styles.wrap}>` to apply the standard max-width and gutter padding used across all other pages

**Files Modified:** `apps/web/app/contact/page.tsx`

---

### Issue #11 — FAQ Accordion: One Open at a Time + Toggle Icon
**Category:** UI · **Priority:** P2

**Problem:**  
All FAQ items could be open simultaneously. The `+` icon did not change to `−` when a question was opened. Implemented using `<details>/<summary>` which had no controlled state.

**Fix Applied:**
- Converted FAQ from `<details>/<summary>` to controlled React state using `openFaq` index
- Only the currently-selected index is expanded; clicking another closes the previous one
- Displays `−` when open and `+` when closed

**Files Modified:** `apps/web/app/page.tsx` (claude-home.tsx), `apps/web/components/claude-home.module.css`

---

### Issue #13 — Footer Social Hyperlinks: Real URLs
**Category:** UI · **Priority:** P2

**Problem:**  
Instagram, LinkedIn and YouTube links in the footer had `href="#"` — clicking them went nowhere.

**Fix Applied:**
- Instagram → `https://www.instagram.com/vivacareeracademy`
- LinkedIn → `https://www.linkedin.com/company/vivacareeracademy`
- YouTube → `https://www.youtube.com/@vivacareeracademy`
- All set to `target="_blank" rel="noopener noreferrer"`

**Files Modified:** `apps/web/app/page.tsx` (claude-home.tsx)

---

### Issue #14 — Admin Header: Single Line at All Viewports
**Category:** UI · **Priority:** P2

**Problem:**  
Admin/internal page navbar overflowed when a session was active — "Open messaging center" and other CTA buttons floated above the navbar because the `navCta` area was too full.

**Fix Applied:**
- Primary/secondary CTAs in the navbar are now only rendered when `navVariant === "public"`
- For `internal` and `student` variants, CTAs are moved to the hero section below the navbar
- Navbar for internal pages only shows: brand logo · nav links · username · sign-out button

**Files Modified:** `apps/web/components/site-shell.tsx`

---

### Issue #16 — Admin User Management: Email Validation
**Category:** Functionality · **Priority:** P2

**Problem:**  
Email was not validated before creating a user login. Inputs like `bademail@` passed validation and a user account was created successfully.

**Fix Applied:**
- Added regex validation `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` before the API call in the create-user flow
- Invalid email now shows an inline error and blocks submission

**Files Modified:** `apps/web/components/admin-user-management.tsx`

---

### Issue #17 — Logout: Sign-Out Button Visible for All Logged-In Users
**Category:** Functionality · **Priority:** P2

**Problem:**  
Logout was only accessible on the `/internal/login` page. No sign-out button was shown in the navbar for logged-in admin, operations, trainer or student users.

**Fix Applied:**
- Added `session` state and `signOut()` function to `SiteShell`
- When `navVariant` is `internal` or `student` and a valid session exists, the navbar shows the user's name and a "Sign out" button
- On sign-out: calls the logout API endpoint, clears the session cookie and redirects to the appropriate login page

**Files Modified:** `apps/web/components/site-shell.tsx`

---

### Issue #19 — General: Logged-In User Name Displayed
**Category:** Functionality · **Priority:** P2

**Problem:**  
No indication of which user was currently logged in. Users had no way to confirm their active session identity.

**Fix Applied:**
- Session name (`session.full_name`) is displayed in the navbar for all authenticated internal and student pages
- Also visible in the mobile hamburger menu dropdown

**Files Modified:** `apps/web/components/site-shell.tsx`

---

### Issue #35 — Admin API: Role Isolation (403 Not 400)
**Category:** Security · **Priority:** P2

**Problem:**  
Trainer or operations sessions hitting admin-only endpoints (`GET /api/v1/academy/applications`, `/batches`) received a `400 Bad Request` instead of `403 Forbidden`. The 400 leaked that the endpoint existed and had specific parameter requirements without confirming the caller was forbidden.

**Fix Applied:**
- `read_applications_secure` and `read_batches_secure` now fall back to the session's own tenant when no `tenant_name` query parameter is supplied
- Requests from non-admin roles are explicitly checked and rejected with `403 Forbidden` before any business logic runs

**Files Modified:** `apps/api/app/academy.py`, `apps/api/app/auth.py`

---

### Issue #36 — Registration Form: Coming-Soon Tooltip
**Category:** UI · **Priority:** P2

**Problem:**  
When a coming-soon course was selected, the submit button was correctly disabled but no explanation was shown. Users saw a greyed-out button with no feedback.

**Fix Applied:**
- Added a `title` attribute to the disabled submit button: *"This course opens for enrolment soon — check back shortly"*
- Tooltip appears on hover over the disabled button

**Files Modified:** `apps/web/components/public-admissions-flow.tsx`

---

### Issue #38 — Internal Login: Error Message Accessibility
**Category:** UI · **Priority:** P2

**Problem:**  
Wrong-credential error state was shown as plain body text with no semantic role. Screen readers could not detect or announce the error.

**Fix Applied:**
- Added `role="alert"` to the error message `<div>` so screen readers announce it immediately when it appears

**Files Modified:** `apps/web/components/student-login-panel.tsx`

---

### Issue #63 — Student Fee Status: View Statement Goes to Receipt
**Category:** Functionality · **Priority:** P2

**Problem:**  
Clicking "View Statement" in the student fee status section navigated back to the student dashboard page instead of opening the fee receipt.

**Fix Applied:**
- "View Statement" link now points to `/payment/receipt/{applicationId}?tenant={tenantName}`
- Correct receipt page is loaded with the student's application ID and tenant in the query string

**Files Modified:** `apps/web/components/student-home-workspace.tsx`

---

### Issue #64 — Student Calendar: Back Button Visibility
**Category:** UI · **Priority:** P2

**Problem:**  
"Back to Home" button on the student calendar page appeared disabled/invisible — no visible border, low contrast against the card background.

**Fix Applied:**
- Button uses explicit `border: 1px solid var(--border)` styling
- Added `←` arrow prefix for clear affordance
- Consistent with the standard ghost-button pattern used across the student workspace

**Files Modified:** `apps/web/components/student-calendar-workspace.tsx`

---

### Issue #65 — Student Test Page: Back Button Visibility
**Category:** UI · **Priority:** P2

**Problem:**  
"Back to Dashboard" button and text on the student test runner page had poor contrast and appeared non-interactive.

**Fix Applied:**
- Same border and `←` prefix fix applied as Issue #64
- Button is visually consistent with all other back-navigation buttons in the student workspace

**Files Modified:** `apps/web/components/student-test-runner.tsx`

---

### Issue #69 — Login: Enter Key Submits Form
**Category:** Functionality · **Priority:** P2

**Problem:**  
Login form could only be submitted by clicking the button with a mouse. Pressing Enter in the password field did nothing.

**Fix Applied:**
- Removed a duplicate `onClick` handler on the submit button that was preventing default form submission
- Login form now uses `type="submit"` button inside an `onSubmit`-wired form element — Enter key works from any field

**Files Modified:** `apps/web/components/operator-gate.tsx`

---

## Mobile & Responsive Fixes

### Mobile Navigation: Fixed Position on Scroll
**Problem:**  
On mobile viewports (≤ 720px), the top navbar and dark announcement banner scrolled away with the page. The nav was set to `position: sticky` which was unreliable inside the flex column layout.

**Fix Applied:**
- At `max-width: 720px`: `.topBanner` and `.nav` are both set to `position: fixed` — banner at `top: 0`, nav at `top: 54px`
- `.page` receives `padding-top: 110px` to compensate for the fixed elements taking space out of document flow
- Both the dark banner and the logo/hamburger bar remain visible and fixed at the top at all times

**Files Modified:** `apps/web/components/claude-home.module.css`

---

### Mobile Navigation: Hamburger Menu Across All Pages
**Problem:**  
Hamburger menu was implemented only on the public home page (`claude-home.tsx`) and marketing shell (`marketing-shell.tsx`). All internal pages (admin, operations, trainer, student) had no mobile menu — nav links were hidden with no way to access them.

**Fix Applied:**
- Added full hamburger menu to `site-shell.tsx` (used by all internal pages)
- Hamburger state (`menuOpen`), toggle button, and mobile dropdown implemented identically to the public shell
- Mobile dropdown includes: all nav links for the current variant, the logged-in user's name and sign-out button

**Files Modified:** `apps/web/components/site-shell.tsx`

---

## Additional Build & Runtime Fixes

### Roster Workbench: TypeScript Build Error
**Problem:**  
`apps/web/components/roster-workbench.tsx` had a syntax error — `certificate_url` was placed outside the `JSON.stringify({})` object body, causing a TypeScript parse error and breaking the entire build.

**Fix Applied:**  
Moved `certificate_url` inside the correct `JSON.stringify` object so all fields are serialised together.

**Files Modified:** `apps/web/components/roster-workbench.tsx`

---

### Onboarding Trainer Page: Duplicate Export Error
**Problem:**  
`apps/web/app/onboarding/trainer/page.tsx` contained two `export default function OnboardingTrainerPage` definitions — 280+ lines of dead code from an earlier draft. This caused a 500 error on the `/onboarding/trainer` route.

**Fix Applied:**  
Removed the duplicate export and all dead code. Kept only the clean server component version with proper session validation and redirect logic.

**Files Modified:** `apps/web/app/onboarding/trainer/page.tsx`

---

## Issues Not Yet Fixed

| Issue | Reason |
|---|---|
| #3 Faculty whitespace | Attempted fix caused photo cropping (Vikas Khanduri forehead cut). Reverted pending a design decision on aspect ratio. |
| #4 OTP validation | Requires external email/SMS service infrastructure. |
| #10 / #40 Rate-limit countdown | UI enhancement requiring timer state in the login panel. |
| #15 Email sending | Requires SMTP configuration and investigation. |
| #18 Student page access | Student demo account confirmed working; underlying issue may be payment stage gate. |
| #30 Hero video 404 | Video files not committed to repository — require asset upload. |
| #41 QA test suite coverage | Test framework work — pages.ts only lists 3 routes. |
| #42 Input maxlength | No maxlength on name/email/phone inputs. |
| #43 Login form wrapper | /internal/login missing `<form>` element for password manager support. |
| #48–51 Backend endpoints | Endpoint paths differ from expected or features not yet implemented. |
| #53–54 IDOR / stored XSS | Requires paid student fixture and pre-seeded injection payload testing. |

---

*Report generated: 15 May 2026 — Viva Career Academy Platform*
