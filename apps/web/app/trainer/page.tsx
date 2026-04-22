import { SiteShell } from "../../components/site-shell";
import { OperatorGate } from "../../components/operator-gate";
import { TrainerReviewWorkspace } from "../../components/trainer-review-workspace";

export default function TrainerPage() {
  return (
    <SiteShell
      activeHref="/trainer"
      eyebrow="Trainer studio"
      title="Trainers review submissions, publish progression, and run disciplined cohort delivery."
      description="The trainer workspace now follows the homepage language too: premium surfaces, clearer hierarchy, and a more deliberate review flow."
      primaryCta={{ label: "Open operations", href: "/operations" }}
      secondaryCta={{ label: "Open admin CMS", href: "/admin" }}
    >
      <OperatorGate title="Trainer sign-in" allowedRoles={["trainer", "admin", "operations"]}>
        <TrainerReviewWorkspace />
      </OperatorGate>
    </SiteShell>
  );
}
