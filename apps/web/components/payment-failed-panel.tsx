"use client";

import Link from "next/link";

export function PaymentFailedPanel({ applicationId }: { applicationId: string }) {
  return (
    <section className="hero hero-contrast">
      <div className="eyebrow" style={{ color: "#F4D77B" }}>Payment issue</div>
      <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>The application was saved, but payment did not complete.</h2>
      <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
        This is the recovery state VIVA needs for real admissions. The counselor can reissue the fee link, and the applicant can resume without restarting the form.
      </p>
      <div className="button-row">
        <Link className="button-primary" href="/admissions">Return to admissions</Link>
        {applicationId ? <Link className="button-secondary" href={`/payment/receipt/${applicationId}`}>View current application record</Link> : null}
      </div>
    </section>
  );
}
