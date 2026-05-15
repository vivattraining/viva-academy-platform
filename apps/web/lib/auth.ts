export type AcademySession = {
  session_token: string;
  access_token: string;
  token_type: "bearer";
  tenant_name: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  expires_at: string;
};

const KEY = "academy-session";
export const SESSION_COOKIE = "academy-session";

function cookieValue(session: AcademySession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function parseSessionCookie(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as AcademySession;
  } catch {
    return null;
  }
}

function isSecureContext() {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

function writeSessionCookie(session: AcademySession | null) {
  if (typeof document === "undefined") return;
  const secureFlag = isSecureContext() ? "; Secure" : "";
  if (!session) {
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
    return;
  }
  const expiresAt = Date.parse(session.expires_at);
  const expires = Number.isNaN(expiresAt) ? "" : `; Expires=${new Date(expiresAt).toUTCString()}`;
  document.cookie = `${SESSION_COOKIE}=${cookieValue(session)}; Path=/; SameSite=Lax${secureFlag}${expires}`;
}

export function readSession() {
  if (typeof window === "undefined") return null;
  try {
    // Cookie is the source of truth (partial C2, 16 May 2026 — the full
    // architectural migration to a server-only httpOnly cookie is on the
    // Tier 1 backlog). Legacy localStorage / sessionStorage values are
    // cleared on read so they stop being readable to any future XSS.
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    if (cookie) {
      // Best-effort cleanup of legacy storage. The cookie is authoritative.
      try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
      try { window.sessionStorage.removeItem(KEY); } catch { /* noop */ }
      return parseSessionCookie(cookie);
    }
    // Migration path: if we still have a session in localStorage from a
    // pre-C2 deployment, restore it into the cookie and clear local
    // storage so subsequent reads use the cookie. After every existing
    // user has cycled through this path, this branch becomes dead code.
    const legacyLocal = window.localStorage.getItem(KEY);
    const legacySession = window.sessionStorage.getItem(KEY);
    const legacy = legacyLocal || legacySession;
    if (!legacy) return null;
    const session = JSON.parse(legacy) as AcademySession;
    writeSessionCookie(session);
    try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
    try { window.sessionStorage.removeItem(KEY); } catch { /* noop */ }
    return session;
  } catch {
    return null;
  }
}

export function isSessionExpired(session: AcademySession | null) {
  if (!session?.expires_at) return true;
  const expiresAt = Date.parse(session.expires_at);
  return Number.isNaN(expiresAt) ? true : expiresAt <= Date.now();
}

export function writeSession(session: AcademySession | null) {
  if (typeof window === "undefined") return;
  // Partial C2 (16 May 2026): cookie only. Always clear localStorage /
  // sessionStorage on write so any pre-C2 deployment artefacts stop
  // being readable by JS. Cookie remains JS-readable (httpOnly: false)
  // for now because OperatorGate / StudentLoginPanel / nav components
  // all call readSession() client-side. The full architectural
  // migration to httpOnly cookie + /api/me endpoint is Tier 1 backlog.
  try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
  try { window.sessionStorage.removeItem(KEY); } catch { /* noop */ }
  writeSessionCookie(session);
  window.dispatchEvent(new Event("academy-session-changed"));
}

export function getAuthHeaders(session?: AcademySession | null) {
  const active = session ?? readSession();
  if (!active) return {};
  const headers: Record<string, string> = {};
  if (active.access_token) {
    headers.Authorization = `Bearer ${active.access_token}`;
  }
  if (active.session_token) {
    headers["x-academy-session"] = active.session_token;
  }
  return headers;
}

export function defaultRouteForRole(role?: string | null) {
  switch (role) {
    case "admin":
      return "/admin";
    case "operations":
      return "/admissions";
    case "trainer":
      return "/trainer";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}
