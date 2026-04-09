import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_FACULTY } from "../../lib/public-site-content";

export default function FacultyPage() {
  return (
    <MarketingShell
      activeHref="/faculty"
      eyebrow="Faculty"
      title="Learn from industry practitioners, not just academic trainers."
      description="VIVA brings together experienced travel professionals, operations leaders, and guest experts so students understand how the industry actually works."
      primaryCta={{ label: "Apply Now", href: "/apply" }}
      secondaryCta={{ label: "Contact Admissions", href: "/contact" }}
    >
      <section className="grid grid-3">
        {PUBLIC_FACULTY.map((item) => (
          <article key={item.name} className="card">
            <div className="eyebrow">{item.role}</div>
            <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>{item.name}</div>
            <p className="muted" style={{ marginTop: 14 }}>{item.bio}</p>
          </article>
        ))}
      </section>

      <section className="hero hero-contrast">
        <div className="eyebrow" style={{ color: "#F4D77B" }}>Teaching approach</div>
        <h2 style={{ marginTop: 14, fontSize: 36, lineHeight: 1.06, letterSpacing: "-0.05em" }}>
          Live sessions, case discussions, practical assignments, and guided readiness.
        </h2>
        <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
          The goal is not just to explain travel concepts. The goal is to prepare students to think, communicate, and perform like professionals.
        </p>
      </section>
    </MarketingShell>
  );
}
