"use client";

import Link from "next/link";
import { useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

export function PublicAdmissionsFlow() {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("Submitting application...");
    try {
      const data = await apiRequest<{ item: { id: string } }>("/api/v1/academy/applications", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          student_name: studentName,
          student_email: studentEmail,
          student_phone: studentPhone,
          course_name: "Travel Professional Certification",
          amount_due: 2500,
          currency: "INR"
        })
      });
      setApplicationId(data.item.id);
      setMessage("Application received. You can now continue to payment.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit application.");
    }
  }

  async function continueToPayment() {
    if (!applicationId) return;
    setMessage("Generating payment link...");
    try {
      const data = await apiRequest<{ payment: { payment_url: string; payment_reference: string } }>(`/api/v1/academy/applications/${applicationId}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ tenant_name: DEFAULT_TENANT })
      });
      setPaymentUrl(data.payment.payment_url);
      setPaymentReference(data.payment.payment_reference);
      setMessage("Payment link is ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate payment link.");
    }
  }

  return (
    <section className="hero hero-contrast">
      <div className="eyebrow" style={{ color: "#F4D77B" }}>Apply now</div>
      <h2 style={{ marginTop: 14, fontSize: 38, lineHeight: 1.06, letterSpacing: "-0.05em" }}>Start your VIVA application in one clean flow.</h2>
      <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7, maxWidth: 760 }}>
        Submit your details, receive your application confirmation, and move to the application fee without waiting for a manual callback.
      </p>
      <div className="grid grid-3" style={{ marginTop: 20 }}>
        <input placeholder="Your full name" value={studentName} onChange={(event) => setStudentName(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600, background: "rgba(255,255,255,0.94)" }} />
        <input placeholder="Your email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600, background: "rgba(255,255,255,0.94)" }} />
        <input placeholder="Your phone" value={studentPhone} onChange={(event) => setStudentPhone(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600, background: "rgba(255,255,255,0.94)" }} />
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void submit()}>Submit application</button>
        {applicationId ? <button className="button-ghost" onClick={() => void continueToPayment()}>Continue to payment</button> : null}
        {paymentUrl ? <a className="button-ghost" href={paymentUrl} target="_blank">Open checkout</a> : null}
        {applicationId && paymentReference ? (
          <Link
            className="button-ghost"
            href={`/payment/success?tenant=${encodeURIComponent(DEFAULT_TENANT)}&applicationId=${encodeURIComponent(applicationId)}&reference=${encodeURIComponent(paymentReference)}`}
          >
            Simulate success
          </Link>
        ) : null}
        {applicationId ? (
          <Link
            className="button-ghost"
            href={`/payment/failed?tenant=${encodeURIComponent(DEFAULT_TENANT)}&applicationId=${encodeURIComponent(applicationId)}`}
          >
            Payment issue?
          </Link>
        ) : null}
      </div>
      {message ? <div className="panel" style={{ marginTop: 18, background: "rgba(255,255,255,0.12)", color: "white" }}>{message}</div> : null}
    </section>
  );
}
