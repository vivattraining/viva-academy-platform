import { MarketingShell } from "../../components/marketing-shell";

export default function DisclosuresPage() {
  return (
    <MarketingShell activeHref="/contact">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Institutional Disclosures</h1>
          <p className="editorial-section-copy">Program details, admissions rules, faculty format, and certification conditions should be published here as official institute disclosures.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
