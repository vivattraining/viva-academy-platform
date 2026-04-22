import { MarketingShell } from "../../components/marketing-shell";
import { PublicAdmissionsFlow } from "../../components/public-admissions-flow";

export default function ApplyPage() {
  return (
    <MarketingShell activeHref="/apply">
      <section className="apply-layout">
        <div className="apply-copy">
          <span className="editorial-kicker">Admissions Open 2026</span>
          <h1 className="apply-title">
            Your career begins with one application.
          </h1>
          <p className="editorial-section-copy">
            The live-site tone is now reflected here too: a concise admissions funnel, premium trust signals, and clear next steps into payment.
          </p>

          <div className="editorial-grid editorial-grid-2">
            <article className="editorial-flag-card left">
              <h3>Submit your application</h3>
              <p>A 15-minute form with background, interests, and one short written response.</p>
            </article>
            <article className="editorial-flag-card right">
              <h3>Admissions conversation</h3>
              <p>A 30-minute online conversation followed by offer and scholarship review.</p>
            </article>
          </div>

          <div className="apply-image-card">
            <div>
              <span>Institutional Excellence</span>
              <strong>Research-First Pedagogy</strong>
            </div>
          </div>
        </div>

        <div className="apply-form-side">
          <PublicAdmissionsFlow />
          <div className="apply-trust-row">
            <span>256-Bit SSL Security</span>
            <span>Razorpay Ready</span>
            <span>Trainer-led Review</span>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
