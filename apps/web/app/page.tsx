import { MarketingShell } from "../components/marketing-shell";
import {
  LIVE_SITE_HERO,
  LIVE_SITE_METRICS,
  LIVE_SITE_PHILOSOPHY,
  LIVE_SITE_PROGRAMS,
  LIVE_SITE_CURRICULUM,
} from "../lib/public-site-content";

export default function HomePage() {
  return (
    <MarketingShell activeHref="/">
      <section className="editorial-page-hero">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">{LIVE_SITE_HERO.eyebrow}</span>
          <h1 className="editorial-page-title">{LIVE_SITE_HERO.title}</h1>
          <p className="editorial-section-copy">{LIVE_SITE_HERO.body}</p>
          <div className="editorial-button-row">
            {LIVE_SITE_HERO.ctas.map((cta, index) => (
              <a key={cta.href} href={cta.href} className={index === 0 ? "editorial-primary" : "editorial-secondary"}>
                {cta.label}
              </a>
            ))}
          </div>
        </div>
        <div className="editorial-page-hero-visual">
          <div
            className="editorial-image-card large"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(11,31,58,0.20), rgba(11,31,58,0.55)), url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="editorial-floating-note">
            <strong>AI Career Input</strong>
            <p>What do you want to become? Generate a track plan and specialization path.</p>
          </div>
        </div>
      </section>

      <section className="editorial-metrics-row">
        {LIVE_SITE_METRICS.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </article>
        ))}
      </section>

      <section className="editorial-section">
        <div className="editorial-section-head">
          <span className="editorial-kicker">Philosophy</span>
          <h2 className="editorial-section-title">Hospitality is a craft. We train for it like one.</h2>
        </div>
        <div className="editorial-grid editorial-grid-3">
          {LIVE_SITE_PHILOSOPHY.map((item) => (
            <article key={item.title} className="editorial-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section editorial-tonal">
        <div className="editorial-section-head">
          <span className="editorial-kicker">Programs</span>
          <h2 className="editorial-section-title">Six career tracks. One unwavering standard.</h2>
        </div>
        <div className="editorial-grid editorial-grid-2">
          {LIVE_SITE_PROGRAMS.map((item) => (
            <article key={item.code} className="editorial-card">
              <span className="editorial-index">{item.code}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="editorial-chip-row">
                <span className="editorial-chip light">{item.duration}</span>
                <span className="editorial-chip light">{item.format}</span>
                <span className="editorial-chip">{item.cohort}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-section-head">
          <span className="editorial-kicker">Curriculum</span>
          <h2 className="editorial-section-title">A syllabus built alongside the industry.</h2>
        </div>
        <div className="editorial-grid editorial-grid-2">
          {LIVE_SITE_CURRICULUM.map((item) => (
            <article key={item.phase} className="editorial-card">
              <span className="editorial-kicker">{item.phase}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="editorial-accordion-body">
                {item.modules.map((module) => (
                  <span key={module}>{module}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
