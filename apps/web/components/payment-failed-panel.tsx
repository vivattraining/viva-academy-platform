"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

export function PaymentFailedPanel({ applicationId, tenant, token }: { applicationId: string; tenant?: string; token?: string }) {
  const [message, setMessage] = useState("We are saving your failed payment attempt so you can resume without restarting.");

  useEffect(() => {
    async function reportFailure() {
      if (!applicationId || !token) {
        return;
      }
      try {
        await apiRequest(`/api/v1/academy/applications/${encodeURIComponent(applicationId)}/payment/verify`, {
          method: "POST",
          body: JSON.stringify({
            tenant_name: tenant || DEFAULT_TENANT,
            token,
            outcome: "failed",
          }),
        });
        setMessage("Your application is still safe. We marked this attempt as failed so the next payment link can be issued cleanly.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to update payment status right now.");
      }
    }

    void reportFailure();
  }, [applicationId, tenant, token]);

  return (
    <section className="hero hero-contrast">
      <div className="eyebrow" style={{ color: "#F4D77B" }}>Payment issue</div>
      <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>The application was saved, but payment did not complete.</h2>
      <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
        {message}
      </p>
      <div className="button-row">
        <Link className="button-primary" href="/apply">Return to application</Link>
        {applicationId ? (
          <Link
            className="button-secondary"
            href={`/payment/receipt/${applicationId}?tenant=${encodeURIComponent(tenant || "Viva Career Academy")}${token ? `&token=${encodeURIComponent(token)}` : ""}`}
          >
            View current application record
          </Link>
        ) : null}
      </div>
    </section>
  );
}
