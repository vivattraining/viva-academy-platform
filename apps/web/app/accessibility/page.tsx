import { MarketingShell } from "../../components/marketing-shell";

export default function AccessibilityPage() {
  return (
    <MarketingShell activeHref="/contact">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Accessibility</h1>
          <p className="editorial-section-copy">VIVA is committed to improving readability, keyboard navigation, and access support across the admissions and learning experience.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
