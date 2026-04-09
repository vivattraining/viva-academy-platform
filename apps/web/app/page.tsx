import { MarketingShell } from "../components/marketing-shell";
import {
  PUBLIC_APPLICANTS,
  PUBLIC_AUTHORITY,
  PUBLIC_COURSE_SNAPSHOT,
  PUBLIC_HERO_HIGHLIGHTS,
  PUBLIC_HOW_IT_WORKS,
  PUBLIC_INDUSTRY_EDGE,
  PUBLIC_MONTHS,
  PUBLIC_PROBLEMS,
  PUBLIC_SOLUTION_POINTS,
  PUBLIC_SPECIALIZATIONS,
  PUBLIC_TESTIMONIALS,
} from "../lib/public-site-content";

export default function HomePage() {
  return (
    <MarketingShell
      activeHref="/"
      eyebrow="Viva Training Institute"
      title="Become a Job-Ready Travel Professional in 90 Days"
      description="Learn directly from industry experts. Get trained, certified, and ready to work in the global travel industry."
      primaryCta={{ label: "Apply Now", href: "/apply" }}
      secondaryCta={{ label: "View Curriculum", href: "/curriculum" }}
    >
      <section className="hero hero-contrast">
        <div className="badge-row">
          {PUBLIC_HERO_HIGHLIGHTS.map((item) => (
            <div key={item} className="badge">{item}</div>
          ))}
        </div>
        <p style={{ marginTop: 16, color: "#D7E4F6", lineHeight: 1.7 }}>{PUBLIC_AUTHORITY.trust}</p>
      </section>

      <section className="card">
        <div className="eyebrow">Authority</div>
        <div style={{ marginTop: 12, fontSize: 30, fontWeight: 900, letterSpacing: "-0.05em" }}>{PUBLIC_AUTHORITY.line}</div>
      </section>

      <section className="grid grid-2">
        {PUBLIC_PROBLEMS.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Why most students fail</div>
            <p className="muted" style={{ marginTop: 12 }}>{item}</p>
          </article>
        ))}
      </section>

      <section className="split">
        <article className="card">
          <div className="eyebrow">Introducing Viva Training Institute</div>
          <div style={{ marginTop: 12, fontSize: 30, fontWeight: 900, letterSpacing: "-0.05em" }}>
            A 90-day structured program designed to make you job-ready from Day 1.
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {PUBLIC_SOLUTION_POINTS.map((item) => (
              <div key={item} className="panel" style={{ background: "#F8FAFC" }}>{item}</div>
            ))}
          </div>
        </article>
        <article className="card">
          <div className="eyebrow">Course snapshot</div>
          <div className="grid grid-3" style={{ marginTop: 18 }}>
            {PUBLIC_COURSE_SNAPSHOT.map((item) => (
              <div key={item.label} className="panel" style={{ background: "#F8FAFC" }}>
                <div className="eyebrow">{item.label}</div>
                <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="eyebrow">How it works</div>
        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {PUBLIC_HOW_IT_WORKS.map((item, index) => (
            <div key={item} className="panel" style={{ background: "#F8FAFC" }}>
              <div className="eyebrow">Step {index + 1}</div>
              <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>{item}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 18, color: "#A61B1B", fontWeight: 800 }}>Miss deadline -&gt; Rs 2000 penalty + 2-day extension</p>
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

      <section className="split">
        <article className="hero hero-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Live class experience</div>
          <h2 style={{ marginTop: 14, fontSize: 34, lineHeight: 1.06, letterSpacing: "-0.05em" }}>
            Weekend live classes, doubt clearing, and guided industry learning.
          </h2>
          <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
            Students learn through live weekend sessions and structured online progression instead of passive video consumption.
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Industry edge</div>
          <div className="grid grid-2" style={{ marginTop: 18 }}>
            {PUBLIC_INDUSTRY_EDGE.map((item) => (
              <div key={item} className="panel" style={{ background: "#F8FAFC" }}>{item}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="split">
        <article className="card">
          <div className="eyebrow">Who should apply</div>
          <div className="badge-row" style={{ marginTop: 18 }}>
            {PUBLIC_APPLICANTS.map((item) => (
              <div key={item} className="badge">{item}</div>
            ))}
          </div>
        </article>
        <article className="card">
          <div className="eyebrow">Specializations</div>
          <div className="badge-row" style={{ marginTop: 18 }}>
            {PUBLIC_SPECIALIZATIONS.map((item) => (
              <div key={item} className="badge">{item}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="hero hero-contrast">
        <div className="eyebrow" style={{ color: "#F4D77B" }}>Urgency</div>
        <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>Only 20 Seats Per Batch</h2>
        <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>Admissions closing soon. This is not just a course, it is your entry into the travel industry.</p>
        <div className="button-row">
          <a href="/apply" className="button-primary">Apply Now</a>
          <a href="/contact" className="button-ghost">Talk to Advisor</a>
        </div>
      </section>

      <section className="grid grid-2">
        {PUBLIC_TESTIMONIALS.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Future-ready testimonial</div>
            <p style={{ marginTop: 12, fontSize: 22, lineHeight: 1.5, letterSpacing: "-0.03em" }}>&ldquo;{item}&rdquo;</p>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
