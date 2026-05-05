import { InternalRouteGate } from "../../../components/internal-route-gate";
import { SiteShell } from "../../../components/site-shell";
import { StudentPreferencesWorkspace } from "../../../components/student-preferences-workspace";
import { requirePaidStudentAccess } from "../../../lib/internal-access";

/**
 * Student notification preferences (per gap analysis §10.5).
 *
 * /student/settings → StudentPreferencesWorkspace — toggles for the
 * supported notification channels. Email is always on (it's the
 * system-of-record channel for fee receipts, certificates, and
 * password resets). WhatsApp + SMS are surfaced as "Coming soon"
 * placeholders until the backend integration lands.
 *
 * Same three layers of protection as /student.
 */
export default async function StudentSettingsPage() {
  await requirePaidStudentAccess();

  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Notification preferences"
      title="Choose how we reach you."
      description="Email is the system-of-record channel — fee receipts, certificates, and password resets always go there. WhatsApp and SMS will be available once we finish setup."
      navVariant="student"
    >
      <InternalRouteGate allowedRoles={["student"]}>
        <StudentPreferencesWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
