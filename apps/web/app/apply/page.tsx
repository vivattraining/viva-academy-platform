import { MarketingShell } from "../../components/marketing-shell";
import { PublicAdmissionsFlow } from "../../components/public-admissions-flow";

export default function ApplyPage() {
  return (
    <MarketingShell
      activeHref="/apply"
      eyebrow="Apply"
      title="Start your VIVA application now."
      description="If you are serious about building a career in travel, tourism, hospitality, or services, submit your details and move into the admissions process."
      primaryCta={{ label: "Talk to Advisor", href: "/contact" }}
      secondaryCta={{ label: "View Curriculum", href: "/curriculum" }}
    >
      <PublicAdmissionsFlow />

      <section className="grid grid-2">
        <article className="card">
          <div className="eyebrow">What happens next</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {["Submit your details", "Receive application confirmation", "Pay the application fee", "Get guided into the next batch"].map((item) => (
              <div key={item} className="panel" style={{ background: "#F8FAFC" }}>{item}</div>
            ))}
          </div>
        </article>
        <article className="card">
          <div className="eyebrow">Who should apply</div>
          <p className="muted" style={{ marginTop: 12 }}>
            Fresh graduates, travel students, career switchers, and job seekers who want disciplined, industry-led learning and a premium institute experience.
          </p>
        </article>
      </section>
    </MarketingShell>
  );
}
