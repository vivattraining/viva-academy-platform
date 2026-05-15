import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSessionExpired, parseSessionCookie, SESSION_COOKIE } from "../../../lib/auth";
import OnboardingTrainerPanel from "../../../components/onboarding-trainer-panel";

export default async function OnboardingTrainerPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const hasToken = Boolean((searchParams.token ?? "").trim());

  if (!hasToken) {
    const cookieStore = await cookies();
    const session = parseSessionCookie(
      cookieStore.get(SESSION_COOKIE)?.value ?? null,
    );
    if (
      !session ||
      isSessionExpired(session) ||
      !["trainer", "admin"].includes(session.role)
    ) {
      redirect("/internal/login");
    }
  }

  return <OnboardingTrainerPanel />;
}
