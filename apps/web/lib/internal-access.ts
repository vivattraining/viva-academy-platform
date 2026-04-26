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
