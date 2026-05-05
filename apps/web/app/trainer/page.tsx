import { SiteShell } from "../../components/site-shell";
import { InternalRouteGate } from "../../components/internal-route-gate";
import { TrainerDashboardWorkspace } from "../../components/trainer-dashboard-workspace";
import { requireInternalPageAccess } from "../../lib/internal-access";

export default async function TrainerPage() {
  await requireInternalPageAccess(["trainer", "admin", "operations"]);

  return (
    <SiteShell
      activeHref="/trainer"
      eyebrow="Trainer studio"
      title="Trainers review submissions, publish progression, and run disciplined cohort delivery."
      description="The trainer workspace now follows the homepage language too: premium surfaces, clearer hierarchy, and a more deliberate review flow."
      primaryCta={{ label: "Open operations", href: "/operations" }}
      secondaryCta={{ label: "Open admin CMS", href: "/admin" }}
      navVariant="internal"
    >
      <InternalRouteGate allowedRoles={["trainer", "admin", "operations"]}>
        <TrainerDashboardWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
