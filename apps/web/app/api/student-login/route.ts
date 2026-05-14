import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

import { parseSessionCookie, SESSION_COOKIE } from "../../../lib/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const DEFAULT_TENANT = "Viva Career Academy";

/**
 * POST /api/student-login
 *
 * Handles the student login form POST. Calling the Python API from the
 * server side and setting the session cookie server-side means:
 *  1. The browser issues a real POST request (not a JS fetch), so Playwright's
 *     click() reliably detects the navigation and waits for it to complete.
 *  2. The session cookie is set before the redirect, so the first SSR request
 *     to /student already sees it — no cookie-timing race.
 */
export async function POST(request: NextRequest) {
  let email: string;
  let password: string;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    email = (body.email || "").trim();
    password = (body.password || "").trim();
  } else {
    const form = await request.formData().catch(() => new FormData());
    email = ((form.get("email") as string) || "").trim();
    password = ((form.get("password") as string) || "").trim();
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const resp = await fetch(`${API_BASE}/api/v1/academy/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant_name: DEFAULT_TENANT, email, password, expected_role: "student" }),
    cache: "no-store",
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const detail = await resp?.json().catch(() => ({}));
    const msg = (detail as { detail?: string }).detail || "Invalid email or password.";
    return NextResponse.json({ error: msg }, { status: resp?.status ?? 502 });
  }

  const data = (await resp.json()) as { session: Record<string, unknown> };
  const session = data.session;

  const cookieStore = await cookies();
  const expiresAt = typeof session.expires_at === "string" ? new Date(session.expires_at) : undefined;
  cookieStore.set(SESSION_COOKIE, encodeURIComponent(JSON.stringify(session)), {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    ...(expiresAt && !isNaN(expiresAt.getTime()) ? { expires: expiresAt } : {}),
  });

  // Also write to localStorage via a small inline script embedded in the redirect page
  // is NOT possible server-side. We rely on /student reading the cookie via `cookies()`.
  // The client-side StudentLoginPanel's readSession() also reads the cookie, so the
  // in-memory session state gets populated on the next render.

  redirect("/student");
}

// Also accept GET for accidental direct visits — redirect to /login.
export async function GET() {
  return NextResponse.redirect(new URL("/login", "http://localhost"), { status: 302 });
}

export const dynamic = "force-dynamic";
