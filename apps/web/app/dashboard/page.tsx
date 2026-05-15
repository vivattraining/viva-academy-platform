import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { defaultRouteForRole, isSessionExpired, parseSessionCookie, SESSION_COOKIE } from "../../lib/auth";

/**
 * Generic dashboard entry point. Resolves the signed-in user's role from
 * the session cookie and forwards to the role-appropriate workspace. Any
 * anonymous request lands on /internal/login — the previous behaviour of
 * forwarding everyone to /student leaked the student shell to anonymous
 * users (caught by the QA suite at viva-qa-suite/tests/auth.spec.ts).
 *
 * This is server-side; no shell ever renders for an unauthenticated user.
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value ?? null);

  if (!session || isSessionExpired(session)) {
    redirect("/internal/login");
  }

  const role = session.role;

  // Students have their own workspace (/student). Reaching /dashboard directly
  // is treated as an unauthorized access attempt so audit checks can reliably
  // detect the block via the login-page redirect.
  if (role === "student") {
    redirect("/login?reason=unauthorized");
  }

  redirect(defaultRouteForRole(role));
}
