import type { Metadata } from "next";

import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_CONTACT } from "../../lib/public-site-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Viva Career Academy admissions. Email admission@vivacareeracademy.com or call +91 70421 07711.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <MarketingShell
      activeHref="/contact"
    >
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">Contact Admissions</span>
          <h1 className="editorial-page-title">Talk to the VIVA admissions team.</h1>
          <p className="editorial-section-copy">
            Speak to an advisor if you want clarity on the batch, fees, curriculum, or the admissions process before you apply.
          </p>
        </div>
      </section>

      <section className="editorial-grid editorial-grid-3">
        <article className="editorial-card"><h3>Email</h3><p>{PUBLIC_CONTACT.email}</p></article>
        <article className="editorial-card"><h3>Phone</h3><p>{PUBLIC_CONTACT.phone}</p></article>
        <article className="editorial-card"><h3>Office</h3><p>{PUBLIC_CONTACT.offices}</p></article>
      </section>

      <section className="editorial-cta-band">
        <div>
          <h2>Need help before you apply?</h2>
          <p>We can guide you on who this program is for, how the cohort works, and what to expect from the 12-week journey.</p>
        </div>
        <div className="editorial-button-row">
          <a href="/apply" className="editorial-primary">Apply Now</a>
          <a href={`mailto:${PUBLIC_CONTACT.email}`} className="editorial-secondary inverse">Email Admissions</a>
        </div>
      </section>
    </MarketingShell>
  );
}
