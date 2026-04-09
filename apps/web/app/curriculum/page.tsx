import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_HOW_IT_WORKS, PUBLIC_MONTHS } from "../../lib/public-site-content";

export default function CurriculumPage() {
  return (
    <MarketingShell
      activeHref="/curriculum"
      eyebrow="Curriculum"
      title="A 12-week progression built to take students from fundamentals to execution."
      description="The program is structured month by month so students build understanding, discipline, and job-ready confidence instead of consuming disconnected theory."
      primaryCta={{ label: "Apply Now", href: "/apply" }}
      secondaryCta={{ label: "View Courses", href: "/courses" }}
    >
      <section className="card">
        <div className="eyebrow">Learning journey</div>
        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {PUBLIC_HOW_IT_WORKS.map((item, index) => (
            <div key={item} className="panel" style={{ background: "#F8FAFC" }}>
              <div className="eyebrow">Step {index + 1}</div>
              <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-3">
        {PUBLIC_MONTHS.map((month) => (
          <article key={month.label} className="card">
            <div className="eyebrow">{month.label}</div>
            <div className="stack" style={{ marginTop: 18 }}>
              {month.items.map((item) => (
                <div key={item} className="panel" style={{ background: "#F8FAFC" }}>{item}</div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="hero hero-contrast">
        <div className="eyebrow" style={{ color: "#F4D77B" }}>Discipline matters</div>
        <h2 style={{ marginTop: 14, fontSize: 36, lineHeight: 1.06, letterSpacing: "-0.05em" }}>
          Weekly progression, evaluation, and accountability are part of the learning model.
        </h2>
        <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
          Students are expected to complete chapters, submit answers, and keep pace with the cohort instead of passively watching content.
        </p>
      </section>
    </MarketingShell>
  );
}
