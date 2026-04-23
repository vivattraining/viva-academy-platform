"use client";

import { getAuthHeaders, readSession, writeSession, type AcademySession } from "./auth";

export const DEFAULT_TENANT = "Viva Career Academy";

export function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

export async function apiRequest<T>(
  path: string,
  input?: RequestInit & { sessionToken?: string | null; accessToken?: string | null; session?: AcademySession | null }
): Promise<T> {
  const headers = new Headers(input?.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  const activeSession = input?.session ?? readSession();
  const explicitSession =
    input?.accessToken || input?.sessionToken
      ? {
          session_token: input?.sessionToken ?? activeSession?.session_token ?? "",
          access_token: input?.accessToken ?? activeSession?.access_token ?? "",
          token_type: "bearer" as const,
          tenant_name: activeSession?.tenant_name ?? DEFAULT_TENANT,
          email: activeSession?.email ?? "",
          full_name: activeSession?.full_name ?? "",
          role: activeSession?.role ?? "",
          created_at: activeSession?.created_at ?? "",
          expires_at: activeSession?.expires_at ?? "",
        }
      : activeSession;
  const authHeaders = getAuthHeaders(
    explicitSession
  );
  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...input,
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as { detail?: string };
  if (!response.ok) {
    if (response.status === 401) {
      writeSession(null);
    }
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }
  return data as T;
}
