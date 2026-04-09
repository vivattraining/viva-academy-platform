"use client";

import Link from "next/link";

export function PaymentSuccessPanel({
  tenant,
  applicationId,
  token,
}: {
  tenant: string;
  applicationId: string;
  token?: string;
}) {
  return (
    <section className="hero hero-contrast">
      <div className="eyebrow" style={{ color: "#F4D77B" }}>Payment success</div>
      <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>Your VIVA application fee is confirmed.</h2>
      <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
        We have recorded your payment success state and are waiting for verified gateway confirmation before enrollment is activated.
      </p>
      <div className="button-row">
        {applicationId ? <Link className="button-primary" href={`/payment/receipt/${applicationId}?tenant=${encodeURIComponent(tenant)}${token ? `&token=${encodeURIComponent(token)}` : ""}`}>Open receipt</Link> : null}
        <Link className="button-secondary" href="/student">Go to learner workspace</Link>
      </div>
    </section>
  );
}
