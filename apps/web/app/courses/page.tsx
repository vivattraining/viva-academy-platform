import { MarketingShell } from "../../components/marketing-shell";
import {
  LIVE_SITE_PROGRAMS,
} from "../../lib/public-site-content";

export default function CoursesPage() {
  return (
    <MarketingShell activeHref="/courses">
      <section className="editorial-page-hero">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">Programs</span>
          <h1 className="editorial-page-title">Career tracks built for modern travel and hospitality careers.</h1>
          <p className="editorial-section-copy">
            The VIVA marketing direction now reflects the live academy site: premium positioning, clear durations, hybrid delivery, and a stronger career-outcomes story.
          </p>
          <div className="editorial-button-row">
            <a href="/apply" className="editorial-primary">Apply Now</a>
            <a href="/curriculum" className="editorial-secondary">View Curriculum</a>
          </div>
        </div>
        <div className="editorial-page-hero-visual">
          <div className="editorial-image-card large" style={{ backgroundImage: "linear-gradient(180deg, rgba(11,31,58,0.18), rgba(11,31,58,0.55)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80')" }} />
          <div className="editorial-floating-note">
            <strong>Fee band</strong>
            <p>Lean MVP placeholder pricing: flagship tracks can be framed between ₹25K and ₹40K.</p>
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-section-head">
          <h2 className="editorial-section-title">Program overview</h2>
        </div>
        <div className="editorial-grid editorial-grid-2">
          {LIVE_SITE_PROGRAMS.map((item) => (
            <article key={item.code} className="editorial-card">
              <span className="editorial-index">{item.code}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="editorial-chip-row">
                <span className="editorial-chip light">Duration {item.duration}</span>
                <span className="editorial-chip light">Format {item.format}</span>
                <span className="editorial-chip">Next cohort {item.cohort}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section editorial-tonal">
        <div className="editorial-grid editorial-grid-2">
          <article className="editorial-card">
            <h3>Payment options</h3>
            <p>Support full fee, deposit-based onboarding, or Razorpay installment plans for the lean launch.</p>
          </article>
          <article className="editorial-card">
            <h3>Specialization upsell</h3>
            <p>After the flagship program, learners can unlock MICE, luxury travel, ticketing, or DMC specialist tracks.</p>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
