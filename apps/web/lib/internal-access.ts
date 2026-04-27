import crypto from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { defaultRouteForRole, isSessionExpired, parseSessionCookie, SESSION_COOKIE } from "./auth";

function base64UrlDecode(value: string): Buffer {
  const padding = 4 - (value.length % 4 || 4);
  const padded = value + (padding === 4 ? "" : "=".repeat(padding));
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Resolve the JWT secret used to verify access tokens.
 * Mirrors the priority order in apps/api/app/auth.py:_jwt_secret.
 */
function jwtSecret(): string | null {
  const candidates = [
    process.env.ACADEMY_JWT_SECRET,
    process.env.RAZORPAY_WEBHOOK_SECRET,
    process.env.ZOOM_CLIENT_SECRET,
  ];
  for (const candidate of candidates) {
    if (candidate && candidate.length >= 16) return candidate;
  }
  return null;
}

/**
 * Verify the HS256 access_token attached to the academy session cookie.
 * Returns the decoded payload on success, null otherwise. Defends against:
 *   - hand-crafted cookies with arbitrary role/expiry
 *   - replays of expired tokens
 *   - signature stripping
 */
function verifyAccessToken(token: string | undefined): {
  role?: string;
  exp?: number;
  sub?: string;
  tenant_name?: string;
} | null {
  if (!token) return null;
  const secret = jwtSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = crypto.createHmac("sha256", secret).update(signingInput).digest();
    actual = base64UrlDecode(signatureB64);
  } catch {
    return null;
  }
  if (!timingSafeEqual(expected, actual)) return null;

  let payload: { role?: string; exp?: number; sub?: string; tenant_name?: string };
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf-8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

export async function requireInternalPageAccess(allowedRoles: string[]) {
  const cookieStore = await cookies();
  const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value ?? null);

  if (!session || isSessionExpired(session)) {
    redirect("/internal/login");
  }

  // Cookie is JS-readable by design (the SPA reads it for tenant context),
  // so an attacker can craft a cookie with any role they like. Defend the
  // server-rendered admin/operations/etc. shells by also verifying the JWT
  // signature on the access_token. If a JWT secret is configured but the
  // signature does not check out, treat the session as forged.
  const verified = verifyAccessToken(session.access_token);
  if (jwtSecret() && !verified) {
    redirect("/internal/login");
  }
  // When verification succeeds, prefer the role from the signed payload
  // because it cannot be forged client-side. Fall back to the cookie role
  // only if no JWT secret is configured (dev-only).
  const trustedRole = verified?.role ?? session.role;

  if (!allowedRoles.includes(trustedRole)) {
    redirect(defaultRouteForRole(trustedRole));
  }

  return { ...session, role: trustedRole };
}

/**
 * Stronger gate for the /student workspace.
 *
 * Layers (defense in depth — every check is independently sufficient):
 *   1. requireInternalPageAccess(["student"]) — auth + role on the JWT.
 *   2. Server-side re-verification against /api/v1/academy/students/me —
 *      reads the application linked to this student's email and confirms
 *      payment_stage === "paid". This catches the case where a credential
 *      was issued, the student logged in, and payment was later refunded
 *      or reversed.
 *
 * Unpaid students are redirected to /apply with a query hint so the
 * admissions page can show a "complete payment" CTA. They never see the
 * student workspace shell.
 */
export async function requirePaidStudentAccess() {
  const session = await requireInternalPageAccess(["student"]);

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.ACADEMY_API_URL ||
    "http://localhost:8000"
  ).replace(/\/+$/, "");
  const tenantName = encodeURIComponent(session.tenant_name);
  const url = `${apiBaseUrl}/api/v1/academy/students/me?tenant_name=${tenantName}`;

  type StudentMeResponse = {
    application?: { payment_stage?: string; id?: string } | null;
  };

  let body: StudentMeResponse | null = null;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "x-academy-session": session.session_token,
        "Content-Type": "application/json",
      },
      // Server fetches must not be cached — payment state changes per request.
      cache: "no-store",
    });
    if (response.status === 401) {
      redirect("/internal/login");
    }
    if (response.status === 404) {
      // No application row yet → the student credential exists but admissions
      // never linked them. Send them to /apply to start the flow.
      redirect("/apply?reason=no-application");
    }
    if (!response.ok) {
      // Don't fail open on other errors — better to bounce the user to a
      // safe surface than render a workspace we can't verify they own.
      redirect("/apply?reason=verification-unavailable");
    }
    body = (await response.json()) as StudentMeResponse;
  } catch {
    redirect("/apply?reason=verification-error");
  }

  const paymentStage = body?.application?.payment_stage;
  if (paymentStage !== "paid") {
    redirect("/apply?reason=payment-pending");
  }

  return session;
}
