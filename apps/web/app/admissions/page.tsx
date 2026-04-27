import { SiteShell } from "../../components/site-shell";
import { AdmissionsWorkbench } from "../../components/admissions-workbench";
import { InternalRouteGate } from "../../components/internal-route-gate";
import { requireInternalPageAccess } from "../../lib/internal-access";

const admissionsCards = [
  {
    title: "Applications",
    body: "Manage applicant flow from first submission through screening and counselor follow-up."
  },
  {
    title: "Payment links",
    body: "Issue Razorpay application fee links and reconcile paid candidates into the batch pipeline."
  },
  {
    title: "Enrollment",
    body: "Move confirmed candidates into active batches and prepare their classroom onboarding automatically."
  },
  {
    title: "Messaging",
    body: "Drive email and WhatsApp nudges from the same admissions state, instead of scattered manual follow-up."
  }
];

const credibilitySignals = [
  "Qualified applications move from enquiry to payment and enrollment in one pipeline",
  "Razorpay-linked application fee flow reduces manual follow-up gaps",
  "Batching, Zoom setup, and learner activation can happen from the same operating surface",
  "Admissions teams can track who has applied, paid, converted, and joined the cohort"
];

const launchTestimonials = [
  {
    name: "Parent-ready confidence",
    quote: "The journey feels structured, premium, and believable from first enquiry to live classroom access."
  },
  {
    name: "Academy operations clarity",
    quote: "Admissions, batch assignment, Zoom provisioning, and attendance no longer sit in disconnected tools."
  }
];

export default async function AdmissionsPage() {
  await requireInternalPageAccess(["admin", "operations"]);

  return (
    <SiteShell
      activeHref="/admissions"
      eyebrow="Internal admissions operations"
      title="Run applicant screening, payment links, and enrollment conversion from one internal workbench."
      description="This route is reserved for the VIVA team. The public student application journey now belongs on /apply, while this surface handles internal admissions operations."
      primaryCta={{ label: "Open admin CMS", href: "/admin" }}
      secondaryCta={{ label: "Open public apply page", href: "/apply" }}
      navVariant="internal"
    >
      <InternalRouteGate allowedRoles={["admin", "operations"]}>
      <section className="split">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Internal only</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "2.35rem" }}>
            This page is for counselors and operators, not students.
          </h2>
          <p className="editorial-workbench-subtitle">
            Students should see the VIVA marketing website and apply journey. Once their application enters the system, your team manages payment, screening, and enrollment here.
          </p>
          <div className="button-row">
            <a href="/apply" className="button-ghost">Review public apply page</a>
          </div>
        </article>
        <article className="editorial-workbench-card">
          <div className="section-head">
            <div className="eyebrow">Operator outcome</div>
            <div className="editorial-workbench-title" style={{ fontSize: "2rem" }}>One admissions surface should own the handoff from application to active batch.</div>
          </div>
          <div className="badge-row">
            <div className="badge">Apply</div>
            <div className="badge">Issue payment link</div>
            <div className="badge">Confirm payment</div>
            <div className="badge">Assign batch</div>
            <div className="badge">Start classroom</div>
          </div>
        </article>
      </section>

      <section className="editorial-workbench-grid">
        <article className="editorial-workbench-card">
          <div className="eyebrow">Why this matters</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {credibilitySignals.map((item) => (
              <div key={item} className="editorial-workbench-panel">{item}</div>
            ))}
          </div>
        </article>
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Public vs internal split</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "2.2rem" }}>The public VIVA website sells the program. This page runs the operation.</h2>
          <div className="badge-row" style={{ marginTop: 18 }}>
            <div className="badge">Internal users only</div>
            <div className="badge">Admissions control</div>
            <div className="badge">Enrollment pipeline</div>
          </div>
          <p className="editorial-workbench-subtitle">
            Keeping this route operational lets you reuse the backend and workbench capabilities later without confusing students or parents with internal controls.
          </p>
        </article>
      </section>

      <section className="editorial-workbench-grid">
        {admissionsCards.map((item) => (
          <article key={item.title} className="editorial-workbench-card">
            <div className="eyebrow">{item.title}</div>
            <p className="muted" style={{ marginTop: 12 }}>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="editorial-workbench-grid">
        {launchTestimonials.map((item) => (
          <article key={item.name} className="editorial-workbench-card">
            <div className="eyebrow">{item.name}</div>
            <p style={{ marginTop: 14, fontSize: 22, lineHeight: 1.45, letterSpacing: "-0.03em" }}>&ldquo;{item.quote}&rdquo;</p>
          </article>
        ))}
      </section>

      <div id="ops">
        <AdmissionsWorkbench />
      </div>
      </InternalRouteGate>
    </SiteShell>
  );
}
