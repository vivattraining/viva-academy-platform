import { OperatorGate } from "../../components/operator-gate";
import { SiteShell } from "../../components/site-shell";
import { StudentWorkspace } from "../../components/student-workspace";

export default function StudentPage() {
  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Student dashboard"
      title="A real learner workspace with live schedule, attendance, and batch-aware delivery."
      description="This view now reads from the academy backend so the student experience reflects actual enrollment state, upcoming classes, and attendance progression."
      primaryCta={{ label: "Open simulation lab", href: "/simulation" }}
      secondaryCta={{ label: "View admissions flow", href: "/admissions" }}
    >
      <OperatorGate title="Student sign-in" allowedRoles={["student"]}>
        <StudentWorkspace />
      </OperatorGate>
    </SiteShell>
  );
}
