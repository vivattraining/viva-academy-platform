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
  const [paymentMode, setPaymentMode] = useState("");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<"submit" | "payment-link" | "checkout" | "">("");

  const formReady =
    studentName.trim().length > 1 &&
    studentEmail.trim().length > 3 &&
    studentPhone.trim().length > 7 &&
    interest.trim().length > 0;

  const paymentLinkReady = Boolean(applicationId);
  const checkoutReady = Boolean(paymentUrl);
  const currentStep = checkoutReady ? 3 : paymentLinkReady ? 2 : 1;

  async function openCheckout() {
    if (!paymentUrl) return;
    setBusyAction("checkout");
    const liveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    try {
      if (paymentMode !== "live" || !liveKey) {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const orderId = (() => {
        try {
          const parsed = new URL(paymentUrl);
          return parsed.searchParams.get("order_id");
        } catch {
          return null;
        }
      })();

      if (!orderId) {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
      if (!existingScript) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.dataset.razorpayCheckout = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Razorpay checkout script."));
          document.body.appendChild(script);
        });
      }

      const RazorpayCtor = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay checkout is unavailable in this browser.");
      }

      const checkout = new RazorpayCtor({
        key: liveKey,
        order_id: orderId,
        name: "Viva Career Academy",
        description: "Application fee",
        prefill: {
          name: studentName,
          email: studentEmail,
          contact: studentPhone,
        },
        handler: () => {
          window.location.href = `/payment/success?tenant=${encodeURIComponent(DEFAULT_TENANT)}&applicationId=${encodeURIComponent(applicationId)}${receiptToken ? `&token=${encodeURIComponent(receiptToken)}` : ""}`;
        },
        modal: {
          ondismiss: () => {
            setMessage("Checkout was closed before payment completed. You can reopen it when you are ready.");
          },
        },
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open checkout right now.");
    } finally {
      setBusyAction("");
    }
  }

  async function submit() {
    if (!formReady) {
      setMessage("Please fill all required details before continuing.");
      return;
    }
    setBusyAction("submit");
    setMessage("Submitting application...");
    try {
      const data = await apiRequest<{ item: { id: string } }>("/api/v1/academy/applications", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          student_name: studentName,
          student_email: studentEmail,
          student_phone: studentPhone,
          course_name: interest || "Professional Certification in Travel & Tourism",
          source: education ? `website:${education}` : "website",
          notes: interest ? `Program interest: ${interest}` : "",
          amount_due: 30000,
          currency: "INR"
        })
      });
      setApplicationId(data.item.id);
      setReceiptToken((data.item as { public_receipt_token?: string }).public_receipt_token || "");
      setMessage("Application received. Step 2 is ready: generate your payment link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit application.");
    } finally {
      setBusyAction("");
    }
  }

  async function continueToPayment() {
    if (!applicationId) return;
    setBusyAction("payment-link");
    setMessage("Generating payment link...");
    try {
      const data = await apiRequest<{ payment: { payment_url: string; payment_reference: string; mode: string } }>(`/api/v1/academy/applications/${applicationId}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ tenant_name: DEFAULT_TENANT })
      });
      setPaymentUrl(data.payment.payment_url);
      setPaymentReference(data.payment.payment_reference);
      setPaymentMode(data.payment.mode);
      setMessage(
        data.payment.mode === "mock"
          ? "Checkout is ready in fallback mode."
          : "Payment link is ready. Step 3 is active: open checkout."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate payment link.");
    } finally {
      setBusyAction("");
    }
  }

  const steps = [
    {
      number: "01",
      title: "Submit details",
      description: "Fill the form and create the application record.",
      state: currentStep > 1 ? "done" : currentStep === 1 ? "active" : "idle",
    },
    {
      number: "02",
      title: "Generate payment link",
      description: "Create the payment request for this application.",
      state: currentStep > 2 ? "done" : currentStep === 2 ? "active" : "idle",
    },
    {
      number: "03",
      title: "Open checkout",
      description: "Continue to Razorpay and complete payment.",
      state: currentStep === 3 ? "active" : "idle",
    },
  ] as const;

  return (
    <section className="editorial-form-shell">
      <div className="editorial-form-header">
        <h2>Registration Form</h2>
        <p>Please fill in your details accurately to initiate your enrollment with Viva Career Academy.</p>
      </div>

      <div className="editorial-form-grid">
        <label className="editorial-field">
          <span>Full Name</span>
          <input placeholder="As per official documents" value={studentName} onChange={(event) => setStudentName(event.target.value)} />
        </label>
        <label className="editorial-field">
          <span>Email Address</span>
          <input placeholder="email@example.com" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} />
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
            <option value="Professional Certification in Travel & Tourism">Professional Certification in Travel & Tourism</option>
            <option value="MICE Specialist">MICE Specialist</option>
            <option value="Luxury Travel Expert">Luxury Travel Expert</option>
            <option value="Ticketing Professional">Ticketing Professional</option>
          </select>
        </label>
      </div>

      <div className="editorial-process-steps" aria-label="Application progress">
        {steps.map((step) => (
          <div key={step.number} className={`editorial-process-step editorial-process-step-${step.state}`}>
            <div className="editorial-process-step-num">{step.number}</div>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="editorial-form-actions">
        <button className="editorial-form-submit editorial-form-button" onClick={() => void submit()} disabled={!formReady || busyAction !== ""}>
          {busyAction === "submit" ? "Submitting..." : "Step 1 · Submit Application"}
        </button>
        <button
          className={`editorial-form-secondary editorial-form-button ${paymentLinkReady ? "is-ready" : ""}`}
          onClick={() => void continueToPayment()}
          disabled={!paymentLinkReady || busyAction !== ""}
        >
          {busyAction === "payment-link" ? "Generating..." : "Step 2 · Generate Payment Link"}
        </button>
        <button
          className={`editorial-form-secondary editorial-form-button ${checkoutReady ? "is-ready" : ""}`}
          onClick={() => void openCheckout()}
          disabled={!checkoutReady || busyAction !== ""}
        >
          {busyAction === "checkout" ? "Opening..." : "Step 3 · Open Checkout"}
        </button>
        {applicationId && paymentReference ? (
          <Link
            className="editorial-form-secondary editorial-form-button"
            href={`/payment/receipt/${applicationId}?tenant=${encodeURIComponent(DEFAULT_TENANT)}${receiptToken ? `&token=${encodeURIComponent(receiptToken)}` : ""}`}
          >
            View Receipt
          </Link>
        ) : null}
      </div>
      <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
        <strong>What the fee unlocks</strong>
        <p className="muted" style={{ marginTop: 8 }}>
          Application screening, admissions review, counselor guidance, and reserved processing toward your VIVA intake.
        </p>
      </div>
      <p className="editorial-form-note">
        Secured by institutional payment gateway • non-refundable processing fee • current intake processing fee: Rs 30,000
        {paymentMode ? ` • mode: ${paymentMode}` : ""}
      </p>
      {message ? <div className="editorial-form-message">{message}</div> : null}
    </section>
  );
}
