/**
 * Canonical page list for the Viva Career Academy audit.
 * Edit here to add/remove routes — every spec consumes this.
 *
 * Audit closure of #41 (15 May 2026): expanded from the original 3 public
 * routes to cover the full ~40 pages discovered under apps/web/app/. Public
 * vs internal classification verified by curl probing production:
 *   - 200 → public (anonymous can render the page)
 *   - 307 → location → /internal/login → internal (auth-gated)
 *   - 307 with no location → public (likely a static-rewrite handler)
 *
 * Dynamic routes use canonical-but-cheap fillers:
 *   - /courses/P-01            — the live P·01 course exists in production
 *   - /certificates/<canary>   — invalid token; renders the graceful error
 *                                 page per #66, so page-audit can still
 *                                 confirm no crash overlay
 *
 * Routes intentionally NOT included (need specific seeded state):
 *   - /payment/receipt/[applicationId] — needs a real paid-application id
 *   - /dashboard/module/[id]            — needs a valid module id under
 *                                          a logged-in student session
 */

export type PageDef = {
  /** URL path, e.g. "/apply" */
  path: string;
  /** Human-readable name used in test titles, screenshots, reports */
  name: string;
  /** Whether the page is publicly reachable without auth */
  public: boolean;
  /** Optional: selector that proves the page rendered (vs. blank/redirect) */
  readyLocator?: string;
};

export const BASE_URL =
  process.env.VIVA_BASE_URL || 'https://www.vivacareeracademy.com';

export const PUBLIC_PAGES: PageDef[] = [
  // ── Marketing / top-level ────────────────────────────────────────────
  { path: '/', name: 'Home', public: true },
  { path: '/apply', name: 'Apply', public: true },
  { path: '/login', name: 'Login', public: true },
  { path: '/contact', name: 'Contact', public: true },
  // ── Catalog ──────────────────────────────────────────────────────────
  { path: '/courses', name: 'Courses', public: true },
  { path: '/courses/P-01', name: 'Course Detail (P·01)', public: true },
  // ── About / people ───────────────────────────────────────────────────
  { path: '/faculty', name: 'Faculty', public: true },
  { path: '/trainers', name: 'Trainers', public: true },
  { path: '/advisory-board', name: 'Advisory Board', public: true },
  { path: '/patron', name: 'Patron', public: true },
  { path: '/guiding-mentor/ashish-bhaiya', name: 'Guiding Mentor — Ashish Bhaiya', public: true },
  // ── Programme content ────────────────────────────────────────────────
  { path: '/curriculum', name: 'Curriculum', public: true },
  { path: '/brochure', name: 'Brochure', public: true },
  { path: '/strategy', name: 'Strategy', public: true },
  { path: '/simulation', name: 'Simulation', public: true },
  // ── Legal / compliance ───────────────────────────────────────────────
  { path: '/accessibility', name: 'Accessibility', public: true },
  { path: '/compliance', name: 'Compliance', public: true },
  { path: '/disclosures', name: 'Disclosures', public: true },
  { path: '/privacy', name: 'Privacy', public: true },
  { path: '/terms', name: 'Terms', public: true },
  // ── Payment landing pages (Razorpay returns here) ────────────────────
  { path: '/payment/success', name: 'Payment Success', public: true },
  { path: '/payment/failed', name: 'Payment Failed', public: true },
  // ── Public verifier — invalid token shows graceful error (#66) ───────
  {
    path: '/certificates/known-invalid-token-audit-canary',
    name: 'Certificate Verifier (invalid token)',
    public: true,
  },
];

export const INTERNAL_PAGES: PageDef[] = [
  { path: '/internal/login', name: 'Internal Login', public: true /* login form is public */ },
  // ── Admin surface ────────────────────────────────────────────────────
  { path: '/admin', name: 'Admin', public: false },
  { path: '/admin/invites', name: 'Admin — Invites', public: false },
  { path: '/admin/review/trainers', name: 'Admin — Trainer Reviews', public: false },
  // ── Operations ───────────────────────────────────────────────────────
  { path: '/admissions', name: 'Admissions', public: false },
  { path: '/operations', name: 'Operations', public: false },
  { path: '/roster', name: 'Roster', public: false },
  { path: '/messages', name: 'Messages', public: false },
  // ── Trainer ──────────────────────────────────────────────────────────
  { path: '/trainer', name: 'Trainer', public: false },
  { path: '/trainer/profile', name: 'Trainer — Profile', public: false },
  { path: '/onboarding/trainer', name: 'Trainer Onboarding', public: false },
  // ── Student ──────────────────────────────────────────────────────────
  { path: '/student', name: 'Student', public: false },
  { path: '/student/calendar', name: 'Student — Calendar', public: false },
  { path: '/student/settings', name: 'Student — Settings', public: false },
  { path: '/student/test', name: 'Student — Test', public: false },
  // ── Cross-role ───────────────────────────────────────────────────────
  { path: '/dashboard', name: 'Dashboard', public: false },
  { path: '/white-label', name: 'White Label', public: false },
];

export const ALL_PAGES: PageDef[] = [...PUBLIC_PAGES, ...INTERNAL_PAGES];

/** Pages that should redirect away (or block) when an anonymous user visits. */
export const ACCESS_GATED_PAGES: PageDef[] = INTERNAL_PAGES.filter((p) => !p.public);

export function fullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
