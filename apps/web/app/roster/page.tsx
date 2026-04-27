import { SiteShell } from "../../components/site-shell";
import { InternalRouteGate } from "../../components/internal-route-gate";
import { RosterWorkbench } from "../../components/roster-workbench";
import { requireInternalPageAccess } from "../../lib/internal-access";

const rosterActions = [
  "Track attendance completion per learner",
  "Surface certificate eligibility from attendance plus assessments",
  "Review active and completed student states",
  "Keep certificates and roster progress tied to the same record"
];

export default async function RosterPage() {
  await requireInternalPageAccess(["admin", "operations", "trainer"]);

  return (
    <SiteShell
      activeHref="/roster"
      eyebrow="Roster and progression"
      title="Track attendance and issue certificates for active students."
      description="The roster should become the operating surface for academic coordinators once learners are enrolled and placed into a live batch."
      primaryCta={{ label: "Open operations", href: "/operations" }}
      secondaryCta={{ label: "Open student view", href: "/student" }}
      navVariant="internal"
    >
      <InternalRouteGate allowedRoles={["admin", "operations", "trainer"]}>
      <section className="split">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Roster discipline</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "2.25rem" }}>
            Certificates, attendance, and learner status now sit in one academic record.
          </h2>
          <p className="editorial-workbench-subtitle">
            This keeps academic operations premium on the front end and consistent on the backend.
          </p>
        </article>
      </section>

      <section className="grid grid-2">
        {rosterActions.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Roster action</div>
            <p className="muted" style={{ marginTop: 12 }}>{item}</p>
          </article>
        ))}
      </section>

        <RosterWorkbench />
      </InternalRouteGate>
    </SiteShell>
  );
}
