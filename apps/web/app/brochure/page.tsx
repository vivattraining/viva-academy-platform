import { MarketingShell } from "../../components/marketing-shell";

export default function BrochurePage() {
  return (
    <MarketingShell activeHref="/courses">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">Program Brochure</span>
          <h1 className="editorial-page-title">Request the VIVA program brochure from admissions.</h1>
          <p className="editorial-section-copy">
            The final brochure PDF is being prepared for release. Until then, use this page as the official prospectus handoff and speak with admissions for the latest curriculum, fees, intake timeline, and career outcomes.
          </p>
          <div className="editorial-button-row">
            <a href="/apply" className="editorial-primary">Apply Now</a>
            <a href="mailto:admission@vivacareeracademy.com?subject=VIVA%20Brochure%20Request" className="editorial-secondary">Email Admissions</a>
            <a href="tel:+917042107711" className="editorial-secondary">Call Admissions</a>
          </div>
          <p className="editorial-section-copy" style={{ marginTop: 18 }}>
            Admissions contact: <strong>admission@vivacareeracademy.com</strong> · <strong>+91 70421 07711</strong>
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
