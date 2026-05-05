import { SiteShell } from "../../../components/site-shell";
import { InternalRouteGate } from "../../../components/internal-route-gate";
import { AdminTrainerInvites } from "../../../components/admin-trainer-invites";
import { requireInternalPageAccess } from "../../../lib/internal-access";

export default async function AdminInvitesPage() {
  await requireInternalPageAccess(["admin", "operations"]);

  return (
    <SiteShell
      activeHref="/admin/invites"
      eyebrow="Trainer invites"
      title="Send trainer onboarding invites."
      description="Each invite emails a single-use link the trainer uses to set a password and complete a profile."
      primaryCta={{ label: "Review queue", href: "/admin/review/trainers" }}
      secondaryCta={{ label: "Back to admin", href: "/admin" }}
      navVariant="internal"
    >
      <InternalRouteGate allowedRoles={["admin", "operations"]}>
        <AdminTrainerInvites />
      </InternalRouteGate>
    </SiteShell>
  );
}
