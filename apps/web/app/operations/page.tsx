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
      <section className="split">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Operations theatre</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "2.3rem" }}>
            Class delivery should feel coordinated, calm, and visible from one surface.
          </h2>
          <p className="editorial-workbench-subtitle">
            Batch mapping, live session setup, Zoom provisioning, and attendance marking now live in the same visual system as the rest of the academy.
          </p>
        </article>
        <article className="editorial-workbench-card">
          <div className="eyebrow">Operational rhythm</div>
          <div className="editorial-workbench-meta">
            <span className="editorial-workbench-chip">Batch selection</span>
            <span className="editorial-workbench-chip">Session control</span>
            <span className="editorial-workbench-chip">Zoom handoff</span>
            <span className="editorial-workbench-chip">Attendance marks</span>
          </div>
        </article>
      </section>

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
