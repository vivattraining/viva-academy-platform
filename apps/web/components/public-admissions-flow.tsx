"use client";

import Link from "next/link";
import { useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

export function PublicAdmissionsFlow() {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [education, setEducation] = useState("");
  const [interest, setInterest] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [receiptToken, setReceiptToken] = useState("");
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
      setReceiptToken((data.item as { public_receipt_token?: string }).public_receipt_token || "");
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
    <section className="editorial-form-shell">
      <div className="editorial-form-header">
        <h2>Registration Form</h2>
        <p>Please fill in your details accurately to initiate your enrollment.</p>
      </div>

      <div className="editorial-form-grid">
        <label className="editorial-field">
          <span>Full Name</span>
          <input placeholder="As per official documents" value={studentName} onChange={(event) => setStudentName(event.target.value)} />
        </label>
        <label className="editorial-field">
          <span>Email Address</span>
          <input placeholder="email@institution.com" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} />
        </label>
        <label className="editorial-field">
          <span>Phone Number</span>
          <input placeholder="+91 98765 43210" value={studentPhone} onChange={(event) => setStudentPhone(event.target.value)} />
        </label>
        <label className="editorial-field">
          <span>Highest Education</span>
          <select value={education} onChange={(event) => setEducation(event.target.value)}>
            <option value="">Select qualification</option>
            <option value="undergraduate">Graduate</option>
            <option value="postgraduate">Post Graduate</option>
            <option value="diploma">Diploma</option>
          </select>
        </label>
        <label className="editorial-field editorial-field-full">
          <span>Interest Area</span>
          <select value={interest} onChange={(event) => setInterest(event.target.value)}>
            <option value="">Select program of interest</option>
            <option value="flagship">Travel Professional Certification</option>
            <option value="mice">MICE Specialist</option>
            <option value="luxury">Luxury Travel Expert</option>
            <option value="ticketing">Ticketing Professional</option>
          </select>
        </label>
      </div>

      <div className="editorial-form-actions">
        <button className="editorial-form-submit" onClick={() => void submit()}>
          Pay Registration Fee
        </button>
        {applicationId ? <button className="editorial-form-secondary" onClick={() => void continueToPayment()}>Generate Payment Link</button> : null}
        {paymentUrl ? <a className="editorial-form-secondary" href={paymentUrl} target="_blank" rel="noopener noreferrer">Open Checkout</a> : null}
        {applicationId && paymentReference ? (
          <Link
            className="editorial-form-secondary"
            href={`/payment/success?tenant=${encodeURIComponent(DEFAULT_TENANT)}&applicationId=${encodeURIComponent(applicationId)}${receiptToken ? `&token=${encodeURIComponent(receiptToken)}` : ""}`}
          >
            Simulate Success
          </Link>
        ) : null}
        {applicationId ? (
          <Link
            className="editorial-form-secondary"
            href={`/payment/failed?tenant=${encodeURIComponent(DEFAULT_TENANT)}&applicationId=${encodeURIComponent(applicationId)}${receiptToken ? `&token=${encodeURIComponent(receiptToken)}` : ""}`}
          >
            Payment Issue?
          </Link>
        ) : null}
      </div>
      <p className="editorial-form-note">Secured by institutional payment gateway • non-refundable processing fee</p>
      {message ? <div className="editorial-form-message">{message}</div> : null}
    </section>
  );
}
