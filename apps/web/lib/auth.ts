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
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AcademySession) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: AcademySession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("academy-session-changed"));
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("academy-session-changed"));
}

