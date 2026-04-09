import { MarketingShell } from "../../components/marketing-shell";
import { PublicAdmissionsFlow } from "../../components/public-admissions-flow";

export default function ApplyPage() {
  return (
    <MarketingShell
      activeHref="/apply"
    >
      <section className="apply-layout">
        <div className="apply-copy">
          <span className="editorial-kicker">Admissions Open 2026</span>
          <h1 className="apply-title">
            Shape Your <span>Professional</span> Future.
          </h1>
          <p className="editorial-section-copy">
            Join an elite community of learners and industry leaders. Our registration process is designed for clarity and rigor, ensuring you are set for success from day one.
          </p>

          <div className="editorial-grid editorial-grid-2">
            <article className="editorial-flag-card left">
              <h3>Global Accreditation</h3>
              <p>Recognized by international educational standards and professional bodies.</p>
            </article>
            <article className="editorial-flag-card right">
              <h3>Swift Evaluation</h3>
              <p>Receive feedback on your application within the admissions workflow.</p>
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
            <span>GDPR Compliant</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
