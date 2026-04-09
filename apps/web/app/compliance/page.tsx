import { MarketingShell } from "../../components/marketing-shell";

export default function CompliancePage() {
  return (
    <MarketingShell activeHref="/contact">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Compliance</h1>
          <p className="editorial-section-copy">VIVA’s data handling, classroom access, payment operations, and certification administration should be documented here for audit and policy reference.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
