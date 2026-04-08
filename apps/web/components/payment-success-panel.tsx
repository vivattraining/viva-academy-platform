"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "../lib/api";

export function PaymentSuccessPanel({
  tenant,
  applicationId,
  reference,
}: {
  tenant: string;
  applicationId: string;
  reference: string;
}) {
  const [message, setMessage] = useState("Finalizing payment confirmation...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      if (!reference) {
        setMessage("Missing payment reference.");
        return;
      }
      try {
        await apiRequest(`/api/v1/academy/payments/webhook/razorpay/${encodeURIComponent(reference)}`, {
          method: "POST",
        });
        if (!cancelled) {
          setDone(true);
          setMessage("Payment confirmed. Enrollment has been activated.");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Unable to confirm payment.");
        }
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <section className="hero hero-contrast">
      <div className="eyebrow" style={{ color: "#F4D77B" }}>Payment success</div>
      <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>Your VIVA application fee is confirmed.</h2>
      <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>{message}</p>
      <div className="button-row">
        {done && applicationId ? <Link className="button-primary" href={`/payment/receipt/${applicationId}?tenant=${encodeURIComponent(tenant)}`}>Open receipt</Link> : null}
        <Link className="button-secondary" href="/student">Go to learner workspace</Link>
      </div>
    </section>
  );
}
