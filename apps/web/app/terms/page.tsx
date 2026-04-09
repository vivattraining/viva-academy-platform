import { MarketingShell } from "../../components/marketing-shell";

export default function TermsPage() {
  return (
    <MarketingShell activeHref="/contact">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Terms of Service</h1>
          <p className="editorial-section-copy">Admissions, enrollment, payment, attendance, and certification workflows are subject to VIVA’s published policies and program rules.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
