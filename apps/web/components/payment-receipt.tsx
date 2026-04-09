"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

type ReceiptItem = {
  id: string;
  student_name: string;
  student_email: string;
  course_name: string;
  amount_due: number;
  currency: string;
  payment_stage: string;
  payment_order_id?: string | null;
  payment_reference?: string | null;
  application_stage: string;
  enrollment_stage: string;
  batch_id?: string | null;
  updated_at: string;
};

export function PaymentReceipt({ applicationId, tenantName }: { applicationId: string; tenantName?: string }) {
  const [item, setItem] = useState<ReceiptItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
        const data = await apiRequest<{ item: ReceiptItem }>(
          `/api/v1/academy/applications/${encodeURIComponent(applicationId)}?tenant_name=${encodeURIComponent(tenantName || DEFAULT_TENANT)}${token ? `&token=${encodeURIComponent(token)}` : ""}`
        );
        setItem(data.item);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load payment receipt.");
      }
    }

    void load();
  }, [applicationId, tenantName]);

  if (error) {
    return <section className="card">{error}</section>;
  }

  if (!item) {
    return <section className="card">Loading receipt...</section>;
  }

  return (
    <section className="card">
      <div className="section-head">
        <div className="eyebrow">Application receipt</div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.05em" }}>{item.student_name}</div>
      </div>
      <div className="badge-row" style={{ marginTop: 18 }}>
        <div className="badge">{item.application_stage}</div>
        <div className="badge">{item.payment_stage}</div>
        <div className="badge">{item.enrollment_stage}</div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="panel" style={{ background: "#F8FAFC" }}>
          <div className="eyebrow">Program</div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900 }}>{item.course_name}</div>
          <p className="muted" style={{ marginTop: 8 }}>{item.student_email}</p>
        </div>
        <div className="panel" style={{ background: "#F8FAFC" }}>
          <div className="eyebrow">Payment</div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900 }}>{item.currency} {item.amount_due.toFixed(2)}</div>
          <p className="muted" style={{ marginTop: 8 }}>Stage: {item.payment_stage}</p>
        </div>
        <div className="panel" style={{ background: "#F8FAFC" }}>
          <div className="eyebrow">Reference</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>{item.payment_reference || "Pending"}</div>
          <p className="muted" style={{ marginTop: 8 }}>Order: {item.payment_order_id || "Not issued"}</p>
        </div>
        <div className="panel" style={{ background: "#F8FAFC" }}>
          <div className="eyebrow">Enrollment</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>{item.enrollment_stage}</div>
          <p className="muted" style={{ marginTop: 8 }}>Batch: {item.batch_id || "Not assigned yet"}</p>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 20, background: "#F8FAFC" }}>
        <div className="eyebrow">What happens next</div>
        <div className="badge-row" style={{ marginTop: 12 }}>
          <div className="badge">Welcome confirmation</div>
          <div className="badge">Batch assignment</div>
          <div className="badge">Zoom reminders</div>
          <div className="badge">Learner dashboard access</div>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 18 }}>Last updated: {item.updated_at}</p>
    </section>
  );
}
