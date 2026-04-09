"use client";

export type AcademySession = {
  session_token: string;
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
    const active = window.sessionStorage.getItem(KEY);
    if (active) return JSON.parse(active) as AcademySession;
    const legacy = window.localStorage.getItem(KEY);
    if (!legacy) return null;
    window.sessionStorage.setItem(KEY, legacy);
    window.localStorage.removeItem(KEY);
    return JSON.parse(legacy) as AcademySession;
  } catch {
    return null;
  }
}

export function writeSession(session: AcademySession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event("academy-session-changed"));
    return;
  }
  window.sessionStorage.setItem(KEY, JSON.stringify(session));
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("academy-session-changed"));
}
