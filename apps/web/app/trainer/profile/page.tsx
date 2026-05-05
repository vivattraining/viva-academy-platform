import { SiteShell } from "../../../components/site-shell";
import { InternalRouteGate } from "../../../components/internal-route-gate";
import { TrainerProfileWorkspace } from "../../../components/trainer-profile-workspace";
import { requireInternalPageAccess } from "../../../lib/internal-access";

export default async function TrainerProfilePage() {
  await requireInternalPageAccess(["trainer", "admin", "operations"]);

  return (
    <SiteShell
      activeHref="/trainer/profile"
      eyebrow="Trainer profile"
      title="Maintain your public faculty profile."
      description="Your photo, bio, expertise, and credentials are reviewed by the admin team before they appear on the public /trainers page."
      primaryCta={{ label: "Back to dashboard", href: "/trainer" }}
      secondaryCta={{ label: "View public trainers", href: "/trainers" }}
      navVariant="internal"
    >
      <InternalRouteGate allowedRoles={["trainer", "admin", "operations"]}>
        <TrainerProfileWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
