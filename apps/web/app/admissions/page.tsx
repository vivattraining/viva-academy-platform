import { SiteShell } from "../../components/site-shell";
import { AdmissionsWorkbench } from "../../components/admissions-workbench";
import { OperatorGate } from "../../components/operator-gate";
import { PublicAdmissionsFlow } from "../../components/public-admissions-flow";

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
  "12-week job-ready travel certification with live faculty and applied labs",
  "Travel, tourism, hospitality, and services aligned curriculum",
  "Zoom-enabled live classes, attendance tracking, and certificates",
  "Admissions, payments, classroom ops, and learner progression in one system"
];

const launchTestimonials = [
  {
    name: "Parent-ready confidence",
    quote: "The journey feels structured, premium, and believable from first enquiry to live classroom access."
  },
  {
    name: "Institute operations clarity",
    quote: "Admissions, batch assignment, Zoom provisioning, and attendance no longer sit in disconnected tools."
  }
];

export default function AdmissionsPage() {
  return (
    <SiteShell
      activeHref="/admissions"
      eyebrow="Admissions operations"
      title="Manage applicant flow from first submission to payment and enrollment."
      description="This is the admissions operating surface for VIVA. Applications, payment-link issuance, and enrollment progression should move through one tenant-scoped workflow."
      primaryCta={{ label: "Open admin CMS", href: "/admin" }}
      secondaryCta={{ label: "Open student view", href: "/student" }}
    >
      <PublicAdmissionsFlow />

      <section className="split">
        <article className="hero hero-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Public application journey</div>
          <h2 style={{ marginTop: 14, fontSize: 36, lineHeight: 1.08, letterSpacing: "-0.05em" }}>
            The student journey should feel guided, premium, and immediate from the first click.
          </h2>
          <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
            A future applicant should understand the program, submit their details, receive confirmation fast, and move to payment without falling into a dead end.
          </p>
          <div className="button-row">
            <a href="#ops" className="button-ghost">Open operator workbench</a>
          </div>
        </article>
        <article className="card">
          <div className="section-head">
            <div className="eyebrow">Operator outcome</div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.05em" }}>One admissions surface should own the handoff from enquiry to paid enrollment.</div>
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

      <section className="grid grid-2">
        <article className="card">
          <div className="eyebrow">Why this converts</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {credibilitySignals.map((item) => (
              <div key={item} className="panel" style={{ background: "#F8FAFC" }}>{item}</div>
            ))}
          </div>
        </article>
        <article className="hero hero-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Launch framing</div>
          <h2 style={{ marginTop: 14, fontSize: 34, lineHeight: 1.06, letterSpacing: "-0.05em" }}>Tomorrow&apos;s demo should feel like a premium institute, not a software prototype.</h2>
          <div className="badge-row" style={{ marginTop: 18 }}>
            <div className="badge">Seats: 20 only</div>
            <div className="badge">Live cohort</div>
            <div className="badge">Career-ready</div>
          </div>
          <p style={{ marginTop: 16, color: "#D7E4F6", lineHeight: 1.7 }}>
            The strongest story is simple: enquiry, guided payment, enrollment, classroom, attendance, and certificate all connect cleanly under VIVA&apos;s own brand.
          </p>
        </article>
      </section>

      <section className="grid grid-2">
        {admissionsCards.map((item) => (
          <article key={item.title} className="card">
            <div className="eyebrow">{item.title}</div>
            <p className="muted" style={{ marginTop: 12 }}>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-2">
        {launchTestimonials.map((item) => (
          <article key={item.name} className="card">
            <div className="eyebrow">{item.name}</div>
            <p style={{ marginTop: 14, fontSize: 22, lineHeight: 1.45, letterSpacing: "-0.03em" }}>&ldquo;{item.quote}&rdquo;</p>
          </article>
        ))}
      </section>

      <div id="ops">
        <OperatorGate title="Admissions workbench" allowedRoles={["admin", "operations"]}>
          <AdmissionsWorkbench />
        </OperatorGate>
      </div>
    </SiteShell>
  );
}
