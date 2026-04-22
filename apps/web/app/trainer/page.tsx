import { SiteShell } from "../../components/site-shell";
import { OperatorGate } from "../../components/operator-gate";
import { TrainerReviewWorkspace } from "../../components/trainer-review-workspace";

export default function TrainerPage() {
  return (
    <SiteShell
      activeHref="/trainer"
      eyebrow="Trainer studio"
      title="Trainers create sessions, publish lessons, record avatar-safe content, and run live Zoom classrooms."
      description="This screen is the working hub for faculty and guest lecturers. It should support live delivery, AI avatar content generation, materials, assignments, and session-level attendance review."
      primaryCta={{ label: "Open operations", href: "/operations" }}
      secondaryCta={{ label: "Open admin CMS", href: "/admin" }}
    >
      <OperatorGate title="Trainer sign-in" allowedRoles={["trainer", "admin", "operations"]}>
        <TrainerReviewWorkspace />
      </OperatorGate>
    </SiteShell>
  );
}
