"use client";

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

export function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const active = window.localStorage.getItem(KEY);
    if (active) return JSON.parse(active) as AcademySession;
    // Migrate any session previously stored in sessionStorage
    const legacy = window.sessionStorage.getItem(KEY);
    if (!legacy) return null;
    window.localStorage.setItem(KEY, legacy);
    window.sessionStorage.removeItem(KEY);
    return JSON.parse(legacy) as AcademySession;
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
  if (!session) {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event("academy-session-changed"));
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.sessionStorage.removeItem(KEY);
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
