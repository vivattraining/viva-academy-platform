import { MarketingShell } from "../../components/marketing-shell";

export default function BrochurePage() {
  return (
    <MarketingShell activeHref="/courses">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">Program Brochure</span>
          <h1 className="editorial-page-title">Download the VIVA program overview.</h1>
          <p className="editorial-section-copy">
            This page can host the final brochure PDF once it is approved. For now, use it as the official brochure destination instead of sending students to a generic contact page.
          </p>
          <div className="editorial-button-row">
            <a href="/apply" className="editorial-primary">Apply Now</a>
            <a href="/contact" className="editorial-secondary">Talk to Admissions</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
