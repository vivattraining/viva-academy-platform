import { SiteShell } from "../../components/site-shell";
import { OperatorGate } from "../../components/operator-gate";
import { RosterWorkbench } from "../../components/roster-workbench";

const rosterActions = [
  "Track attendance completion per learner",
  "Surface certificate eligibility from attendance plus assessments",
  "Review active and completed student states",
  "Keep certificates and roster progress tied to the same record"
];

export default function RosterPage() {
  return (
    <SiteShell
      activeHref="/roster"
      eyebrow="Roster and progression"
      title="Track attendance and issue certificates for active students."
      description="The roster should become the operating surface for academic coordinators once learners are enrolled and placed into a live batch."
      primaryCta={{ label: "Open operations", href: "/operations" }}
      secondaryCta={{ label: "Open student view", href: "/student" }}
    >
      <section className="grid grid-2">
        {rosterActions.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Roster action</div>
            <p className="muted" style={{ marginTop: 12 }}>{item}</p>
          </article>
        ))}
      </section>

      <OperatorGate title="Roster and certification workspace" allowedRoles={["admin", "operations", "trainer"]}>
        <RosterWorkbench />
      </OperatorGate>
    </SiteShell>
  );
}
