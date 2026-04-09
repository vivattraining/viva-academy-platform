import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_CONTACT } from "../../lib/public-site-content";

export default function ContactPage() {
  return (
    <MarketingShell
      activeHref="/contact"
      eyebrow="Contact"
      title="Talk to the VIVA admissions team."
      description="If you want to understand the program, batch timing, admissions process, or application fee, reach out and we will guide you."
      primaryCta={{ label: "Apply Now", href: "/apply" }}
      secondaryCta={{ label: "View Courses", href: "/courses" }}
    >
      <section className="grid grid-3">
        <article className="card">
          <div className="eyebrow">Email</div>
          <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em" }}>{PUBLIC_CONTACT.email}</div>
        </article>
        <article className="card">
          <div className="eyebrow">Phone</div>
          <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em" }}>{PUBLIC_CONTACT.phone}</div>
        </article>
        <article className="card">
          <div className="eyebrow">Presence</div>
          <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em" }}>{PUBLIC_CONTACT.offices}</div>
        </article>
      </section>

      <section className="hero hero-contrast">
        <div className="eyebrow" style={{ color: "#F4D77B" }}>Admissions support</div>
        <h2 style={{ marginTop: 14, fontSize: 36, lineHeight: 1.06, letterSpacing: "-0.05em" }}>
          Speak to an advisor before you apply if you need clarity.
        </h2>
        <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
          We can guide you on who this program is for, how the cohort works, and what to expect from the 12-week journey.
        </p>
      </section>
    </MarketingShell>
  );
}
