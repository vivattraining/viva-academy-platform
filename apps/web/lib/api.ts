"use client";

export const DEFAULT_TENANT = "VIVA Training Institute";

export function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

export async function apiRequest<T>(path: string, input?: RequestInit & { sessionToken?: string | null }): Promise<T> {
  const headers = new Headers(input?.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (input?.sessionToken) {
    headers.set("x-academy-session", input.sessionToken);
  }
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...input,
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as { detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }
  return data as T;
}

