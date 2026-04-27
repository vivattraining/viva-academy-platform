import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { defaultRouteForRole, isSessionExpired, parseSessionCookie, SESSION_COOKIE } from "../../lib/auth";

/**
 * White-label settings was removed from the live surface (see
 * VIVA-WHITE-LABEL-REMOVED-FROM-LIVE-2026-04-24.md). Anonymous users go
 * back to the marketing site; signed-in non-admin users go to their own
 * workspace; admins land on /admin where future white-label tooling will
 * live. This page never renders any content — all branches redirect
 * server-side, so there is no shell to leak.
 */
export default async function WhiteLabelPage() {
  const cookieStore = await cookies();
  const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value ?? null);

  if (!session || isSessionExpired(session)) {
    redirect("/");
  }

  redirect(defaultRouteForRole(session.role));
}
