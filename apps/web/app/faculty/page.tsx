import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_FACULTY } from "../../lib/public-site-content";

export default function FacultyPage() {
  return (
    <MarketingShell
      activeHref="/faculty"
    >
      <section className="editorial-page-hero faculty">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Architects of Academic Excellence</h1>
          <p className="editorial-section-copy">
            Our faculty comprises distinguished industry mentors, guest experts, and execution-focused trainers dedicated to bridging theory with practice.
          </p>
        </div>
        <div className="editorial-image-card large" style={{ backgroundImage: "linear-gradient(180deg, rgba(0,6,102,0.12), rgba(0,6,102,0.24)), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80')" }} />
      </section>

      <section className="editorial-section">
        <div className="editorial-section-head">
          <h2 className="editorial-section-title">Trainer Profiles</h2>
        </div>
        <div className="editorial-grid editorial-grid-3">
          {PUBLIC_FACULTY.map((item) => (
            <article key={item.name} className="faculty-card">
              <div className="faculty-photo" />
              <span className="faculty-role">{item.role}</span>
              <h3>{item.name}</h3>
              <p>{item.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-section editorial-tonal">
        <div className="editorial-grid editorial-grid-2">
          <article className="editorial-card">
            <h3>Industry Experts</h3>
            <p>Where academic structure meets the pulse of the market. Our experts bring live business context into the classroom.</p>
          </article>
          <article className="editorial-card">
            <h3>Guest Lecturers</h3>
            <p>Gain insights that books cannot teach through live sessions, case reviews, practical assignments, and professional coaching.</p>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
