import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_SPECIALIZATIONS } from "../../lib/public-site-content";

export default function CoursesPage() {
  return (
    <MarketingShell
      activeHref="/courses"
      eyebrow="Courses"
      title="A 3-month certification program built to make travel professionals job-ready."
      description="Weekend live classes, online learning, real case studies, and a disciplined progression system designed for serious outcomes."
      primaryCta={{ label: "Apply Now", href: "/apply" }}
      secondaryCta={{ label: "View Curriculum", href: "/curriculum" }}
    >
      <section className="card">
        <div className="eyebrow">3-Month Certification Program</div>
        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <div className="panel" style={{ background: "#F8FAFC" }}><strong>Duration</strong><p className="muted">12 Weeks</p></div>
          <div className="panel" style={{ background: "#F8FAFC" }}><strong>Format</strong><p className="muted">Weekend Live Classes + Online Learning</p></div>
          <div className="panel" style={{ background: "#F8FAFC" }}><strong>Batch Size</strong><p className="muted">20 Students</p></div>
        </div>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <div className="eyebrow">What you will learn</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {["Travel Industry Fundamentals", "Itinerary Planning", "Ticketing & Pricing", "Visa & Documentation", "MICE & Corporate Travel", "Luxury Travel"].map((item) => (
              <div key={item} className="panel" style={{ background: "#F8FAFC" }}>{item}</div>
            ))}
          </div>
        </article>
        <article className="card">
          <div className="eyebrow">Industry induction</div>
          <p className="muted" style={{ marginTop: 12 }}>
            Learn directly from travel companies through booking procedures, SOPs, and company workflows so you are interview-ready from day one.
          </p>
        </article>
      </section>

      <section className="card">
        <div className="eyebrow">Specialization programs</div>
        <div className="badge-row" style={{ marginTop: 18 }}>
          {PUBLIC_SPECIALIZATIONS.map((item) => (
            <div key={item} className="badge">{item}</div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
