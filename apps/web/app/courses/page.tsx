import { MarketingShell } from "../../components/marketing-shell";
import {
  PUBLIC_PROGRAM_OUTCOMES,
  PUBLIC_SPECIALIZATIONS,
} from "../../lib/public-site-content";

export default function CoursesPage() {
  return (
    <MarketingShell
      activeHref="/courses"
    >
      <section className="editorial-page-hero">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">Certification Program</span>
          <h1 className="editorial-page-title">3-Month Certification Program</h1>
          <p className="editorial-section-copy">
            Elevate your career with our intensive certification track, designed for students seeking job-ready technical mastery and industry discipline.
          </p>
          <div className="editorial-button-row">
            <a href="/apply" className="editorial-primary">Apply Now</a>
            <a href="/brochure" className="editorial-secondary">Download Brochure</a>
          </div>
        </div>
        <div className="editorial-page-hero-visual">
          <div className="editorial-image-card large" style={{ backgroundImage: "linear-gradient(180deg, rgba(0,6,102,0.18), rgba(0,6,102,0.5)), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80')" }} />
          <div className="editorial-floating-note">
            <strong>Starting Soon</strong>
            <p>Limited seats available for the upcoming cohort.</p>
          </div>
        </div>
      </section>

      <section className="editorial-metrics-row">
        <article><span>Duration</span><strong>90 Days</strong><small>12-week structured progression</small></article>
        <article><span>Format</span><strong>Weekend Live</strong><small>Weekend live classes + online learning</small></article>
        <article><span>Batch Size</span><strong>Max 20</strong><small>Small cohorts for mentorship</small></article>
      </section>

      <section className="editorial-section">
        <div className="editorial-section-head">
          <h2 className="editorial-section-title">Modules Overview</h2>
        </div>
        <div className="editorial-stack">
          {[
            { index: "01", title: "Travel Industry Fundamentals", items: ["Geography", "Industry overview", "Core ecosystem", "Destination logic"] },
            { index: "02", title: "Operations and Customer Handling", items: ["Itinerary planning", "Pricing", "Visa processes", "Customer handling"] },
            { index: "03", title: "Specialization and Industry Readiness", items: ["MICE", "Luxury", "Sales", "Crisis handling"] },
          ].map((item) => (
            <article key={item.index} className="editorial-accordion-card">
              <div className="editorial-accordion-head">
                <div>
                  <span className="editorial-index">{item.index}</span>
                  <h3>{item.title}</h3>
                </div>
              </div>
              <div className="editorial-accordion-body">
                {item.items.map((row) => (
                  <span key={row}>{row}</span>
                ))}
              </div>
            </article>
          ))}
          <div className="editorial-accordion-note">Total 12 intensive modules included in the curriculum.</div>
        </div>
      </section>

      <section className="editorial-section editorial-tonal">
        <div className="editorial-grid editorial-grid-2">
          <article className="editorial-card">
            <h3>Industry Induction Program</h3>
            <p>Learn directly from travel companies through booking procedures, SOPs, and company workflows so you are interview-ready from Day 1.</p>
            <div className="editorial-chip-row">
              {PUBLIC_PROGRAM_OUTCOMES.map((item) => (
                <span key={item} className="editorial-chip light">{item}</span>
              ))}
            </div>
          </article>
          <article className="editorial-card">
            <h3>Specialization Programs</h3>
            <div className="editorial-chip-row">
              {PUBLIC_SPECIALIZATIONS.map((item) => (
                <span key={item} className="editorial-chip">{item}</span>
              ))}
            </div>
            <p>Available only after successful completion of the flagship certification program.</p>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
