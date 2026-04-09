import { MarketingShell } from "../components/marketing-shell";
import {
  PUBLIC_APPLICANTS,
  PUBLIC_AUTHORITY,
  PUBLIC_COURSE_HIGHLIGHTS,
  PUBLIC_COURSE_SNAPSHOT,
  PUBLIC_FINAL_POSITIONING,
  PUBLIC_HERO_HIGHLIGHTS,
  PUBLIC_HOW_IT_WORKS,
  PUBLIC_INDUSTRY_EDGE,
  PUBLIC_MONTHS,
  PUBLIC_PROBLEMS,
  PUBLIC_SOLUTION_POINTS,
  PUBLIC_SPECIALIZATIONS,
  PUBLIC_TESTIMONIALS,
  PUBLIC_TRAVEL_REASONS,
} from "../lib/public-site-content";

export default function HomePage() {
  return (
    <MarketingShell
      activeHref="/"
    >
      <section className="editorial-hero" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,6,102,0.92) 0%, rgba(0,6,102,0.68) 45%, rgba(0,6,102,0.12) 100%), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80')" }}>
        <div className="editorial-hero-content">
          <span className="editorial-kicker">New Batch Starts Soon</span>
          <h1 className="editorial-display">
            Become a Certified Travel Professional in 90 Days
          </h1>
          <p className="editorial-subtitle">
            Join the industry leaders and master the art of global travel management with our structured certification program.
          </p>
          <div className="editorial-button-row">
            <a href="/apply" className="editorial-primary">Apply Now</a>
            <a href="/courses" className="editorial-secondary">Explore Programs</a>
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-grid editorial-grid-hero-info">
          <div className="editorial-text-column">
            <h2 className="editorial-section-title">The Future of Global Mobility</h2>
            <p className="editorial-section-copy">
              The travel industry is growing fast, and employers increasingly need professionals who understand systems, service, operations, and real execution.
            </p>
            <div className="editorial-stack">
              {PUBLIC_TRAVEL_REASONS.slice(0, 2).map((item) => (
                <div key={item} className="editorial-icon-row">
                  <div className="editorial-icon-box">↗</div>
                  <div>
                    <h4>{item}</h4>
                    <p>Travel and tourism continues to create domestic and global career pathways.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="editorial-mosaic">
            <div className="editorial-image-card tall" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1000&q=80')" }} />
            <div className="editorial-stat-card primary">
              <span>15.5T</span>
              <small>Global industry worth</small>
            </div>
            <div className="editorial-stat-card light">
              <span>100M+</span>
              <small>Projected jobs</small>
            </div>
            <div className="editorial-image-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1000&q=80')" }} />
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-tonal">
        <div className="editorial-section-head center">
          <h2 className="editorial-section-title">Why Viva Training Institute</h2>
          <p className="editorial-section-copy">Setting the standard through industry integration, rigor, and premium learning structure.</p>
        </div>
        <div className="editorial-grid editorial-grid-why">
          <article className="editorial-card">
            <div className="editorial-card-icon">✦</div>
            <h3>Legacy of Experience</h3>
            <p>{PUBLIC_AUTHORITY.line}</p>
          </article>
          <article className="editorial-card primary-feature">
            <div className="editorial-card-icon">◆</div>
            <h3>Powered by Viva Voyages</h3>
            <p>Learn from professionals, not just trainers. Industry-integrated curriculum with real business exposure.</p>
          </article>
          <article className="editorial-card">
            <div className="editorial-card-icon">✦</div>
            <h3>Job-Ready Outcomes</h3>
            <p>We do not just teach. We prepare students for the real world of travel, tourism, hospitality, and services.</p>
          </article>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-program-strip">
          <div>
            <h2 className="editorial-section-title">Advanced Travel & Tourism Diploma</h2>
            <p className="editorial-section-copy">A structured 12-week pathway with live classes, real case studies, and disciplined progression.</p>
          </div>
          <div className="editorial-chip-row">
            {PUBLIC_HERO_HIGHLIGHTS.map((item) => (
              <span key={item} className="editorial-chip">{item}</span>
            ))}
          </div>
        </div>

        <div className="editorial-grid editorial-grid-4">
          {PUBLIC_COURSE_HIGHLIGHTS.slice(0, 4).map((item) => (
            <article key={item} className="editorial-metric-card">
              <h3>{item}</h3>
              <p>Built for serious learners who want career-ready outcomes, not theory alone.</p>
            </article>
          ))}
        </div>

        <div className="editorial-logos">
          {["Amadeus", "IATA", "GTA", "Lufthansa", "Marriott", "Sabre"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="editorial-section editorial-testimonials">
        <div className="editorial-section-head">
          <h2 className="editorial-section-title">Future-Ready Success Stories</h2>
        </div>
        <div className="editorial-grid editorial-grid-2">
          {PUBLIC_TESTIMONIALS.map((item, index) => (
            <article key={item} className="editorial-quote-card">
              <p>&ldquo;{item}&rdquo;</p>
              <div className="editorial-quote-meta">
                <span className="editorial-avatar">{index + 1}</span>
                <div>
                  <strong>VIVA Student</strong>
                  <small>Career-ready cohort</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-cta-band">
        <div>
          <h2>Your Journey into the Travel Industry Starts Here.</h2>
          <p>Limited seats per batch. Structured progression. Live faculty. Industry-backed outcomes.</p>
        </div>
        <div className="editorial-button-row">
          <a href="/apply" className="editorial-primary">Join Next Batch</a>
          <a href="/brochure" className="editorial-secondary inverse">Download Brochure</a>
        </div>
      </section>
    </MarketingShell>
  );
}
