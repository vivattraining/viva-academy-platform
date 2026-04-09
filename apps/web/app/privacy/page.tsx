import { MarketingShell } from "../../components/marketing-shell";

export default function PrivacyPage() {
  return (
    <MarketingShell activeHref="/contact">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Privacy Policy</h1>
          <p className="editorial-section-copy">VIVA collects only the admissions and classroom information required to process applications, manage cohorts, and support student delivery.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
