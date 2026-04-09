import { OperatorGate } from "../../components/operator-gate";
import { SiteShell } from "../../components/site-shell";
import { StudentWorkspace } from "../../components/student-workspace";

export default function StudentPage() {
  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Student dashboard"
      title="Track progress, live classes, deadlines, and certification readiness."
      description="The learner experience now reflects batch state, attendance progression, and upcoming live interaction in a more polished dashboard view."
      primaryCta={{ label: "Open simulation lab", href: "/simulation" }}
      secondaryCta={{ label: "View roster", href: "/roster" }}
    >
      <OperatorGate title="Student sign-in" allowedRoles={["student"]}>
        <StudentWorkspace />
      </OperatorGate>
    </SiteShell>
  );
}
