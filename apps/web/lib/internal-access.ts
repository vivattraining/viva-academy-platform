import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { defaultRouteForRole, isSessionExpired, parseSessionCookie, SESSION_COOKIE } from "./auth";

export async function requireInternalPageAccess(allowedRoles: string[]) {
  const cookieStore = await cookies();
  const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value ?? null);

  if (!session || isSessionExpired(session)) {
    redirect("/internal/login");
  }

  if (!allowedRoles.includes(session.role)) {
    redirect(defaultRouteForRole(session.role));
  }

  return session;
}
