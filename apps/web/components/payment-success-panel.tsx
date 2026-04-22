"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

export function PaymentSuccessPanel({
  tenant,
  applicationId,
  token,
}: {
  tenant: string;
  applicationId: string;
  token?: string;
}) {
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment with the gateway.");

  useEffect(() => {
    async function verify() {
      if (!applicationId || !token) {
        setStatus("error");
        setMessage("Missing application reference. Open the receipt link from your admissions journey to verify payment.");
        return;
      }
      try {
        const data = await apiRequest<{ item: { payment_stage: string; payment_mode?: string | null } }>(
          `/api/v1/academy/applications/${encodeURIComponent(applicationId)}/payment/verify`,
          {
            method: "POST",
            body: JSON.stringify({
              tenant_name: tenant || DEFAULT_TENANT,
              token,
              outcome: "success",
            }),
          }
        );
        if (data.item.payment_stage === "paid") {
          setStatus("paid");
          setMessage(
            data.item.payment_mode === "mock"
              ? "Mock payment confirmed. This keeps the launch demo flow working when live Razorpay keys are absent."
              : "Payment verified with Razorpay. Enrollment is now ready to continue."
          );
          return;
        }
        setStatus("pending");
        setMessage("We received your return from checkout, but the gateway confirmation is still pending. The receipt will keep updating.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to verify payment right now.");
      }
    }

    void verify();
  }, [applicationId, tenant, token]);

  return (
    <section className="hero hero-contrast">
      <div className="eyebrow" style={{ color: "#F4D77B" }}>Payment success</div>
      <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>
        {status === "paid" ? "Your VIVA application fee is confirmed." : "We are checking your payment confirmation."}
      </h2>
      <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
        {message}
      </p>
      <div className="button-row">
        {applicationId ? <Link className="button-primary" href={`/payment/receipt/${applicationId}?tenant=${encodeURIComponent(tenant)}${token ? `&token=${encodeURIComponent(token)}` : ""}`}>Open receipt</Link> : null}
        <Link className="button-secondary" href="/student">Go to learner workspace</Link>
      </div>
    </section>
  );
}
