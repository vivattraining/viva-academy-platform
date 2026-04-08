import { SiteShell } from "../../components/site-shell";
import { OperatorGate } from "../../components/operator-gate";
import { OperationsWorkbench } from "../../components/operations-workbench";

const opsCards = [
  ["Batch creation", "Create VIVA and future tenant batches with trainer, seat capacity, and live-class model."],
  ["Session planning", "Schedule live classes with Zoom provisioning, timezone, and attendance mode."],
  ["Roster", "Move paid students into active batches and keep the roster aligned with enrollment state."],
  ["Attendance", "Capture trainer marks plus Zoom join-tracked presence on a session-by-session basis."]
];

export default function OperationsPage() {
  return (
    <SiteShell
      activeHref="/operations"
      eyebrow="Batch and session operations"
      title="Manage batches, sessions, trainer attendance, and automatic join-based marking."
      description="This is the academy operations layer for real class delivery: batch mapping, session-wise attendance by date, trainer actions, and Zoom-linked presence."
      primaryCta={{ label: "Open roster", href: "/roster" }}
      secondaryCta={{ label: "Open admissions", href: "/admissions" }}
    >
      <section className="grid grid-2">
        {opsCards.map(([title, body]) => (
          <article key={title} className="card">
            <div className="eyebrow">{title}</div>
            <p className="muted" style={{ marginTop: 12 }}>{body}</p>
          </article>
        ))}
      </section>

      <OperatorGate title="Live classroom operations" allowedRoles={["admin", "operations", "trainer"]}>
        <OperationsWorkbench />
      </OperatorGate>
    </SiteShell>
  );
}
