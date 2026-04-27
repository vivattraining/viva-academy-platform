/**
 * Canonical page list for the Viva Career Academy audit.
 * Edit here to add/remove routes — every spec consumes this.
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
  { path: '/', name: 'Home', public: true },
  { path: '/apply', name: 'Apply', public: true },
  { path: '/login', name: 'Login', public: true },
];

export const INTERNAL_PAGES: PageDef[] = [
  { path: '/internal/login', name: 'Internal Login', public: true /* login form is public */ },
  { path: '/admin', name: 'Admin', public: false },
  { path: '/admissions', name: 'Admissions', public: false },
  { path: '/operations', name: 'Operations', public: false },
  { path: '/roster', name: 'Roster', public: false },
  { path: '/messages', name: 'Messages', public: false },
  { path: '/trainer', name: 'Trainer', public: false },
  { path: '/student', name: 'Student', public: false },
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
