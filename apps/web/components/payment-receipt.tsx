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
  payment_mode?: string | null;
  payment_gateway_status?: string | null;
  payment_gateway_order_status?: string | null;
  payment_gateway_payment_id?: string | null;
  payment_reconciliation_status?: string | null;
  payment_verified_at?: string | null;
  payment_failed_at?: string | null;
  payment_last_checked_at?: string | null;
  application_stage: string;
  enrollment_stage: string;
  batch_id?: string | null;
  updated_at: string;
};

export function PaymentReceipt({ applicationId, tenantName }: { applicationId: string; tenantName?: string }) {
  const [item, setItem] = useState<ReceiptItem | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function load(triggerVerification = false) {
      try {
        const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
        const tenant = tenantName || DEFAULT_TENANT;
        const data = triggerVerification && token
          ? await apiRequest<{ item: ReceiptItem }>(
              `/api/v1/academy/applications/${encodeURIComponent(applicationId)}/payment/verify`,
              {
                method: "POST",
                body: JSON.stringify({ tenant_name: tenant, token }),
              }
            )
          : await apiRequest<{ item: ReceiptItem }>(
              `/api/v1/academy/applications/${encodeURIComponent(applicationId)}?tenant_name=${encodeURIComponent(tenant)}${token ? `&token=${encodeURIComponent(token)}` : ""}`
            );
        setItem(data.item);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load payment receipt.");
      }
    }

    void load(true);
  }, [applicationId, tenantName]);

  async function refreshStatus() {
    setIsRefreshing(true);
    try {
      const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
      const data = await apiRequest<{ item: ReceiptItem }>(
        `/api/v1/academy/applications/${encodeURIComponent(applicationId)}/payment/verify`,
        {
          method: "POST",
          body: JSON.stringify({ tenant_name: tenantName || DEFAULT_TENANT, token }),
        }
      );
      setItem(data.item);
      setError("");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh payment status.");
    } finally {
      setIsRefreshing(false);
    }
  }

  if (error) {
    return <section className="card">{error}</section>;
  }

  if (!item) {
    return <section className="card">Loading receipt...</section>;
  }

  return (
    <section className="editorial-workbench-card">
      <div className="section-head">
        <div className="eyebrow">Application receipt</div>
        <div className="editorial-workbench-title" style={{ fontSize: "2.25rem" }}>{item.student_name}</div>
      </div>
      <div className="badge-row" style={{ marginTop: 18 }}>
        <div className="badge">{item.application_stage}</div>
        <div className="badge">{item.payment_stage}</div>
        <div className="badge">{item.enrollment_stage}</div>
      </div>
      <div className="editorial-workbench-grid" style={{ marginTop: 20 }}>
        <div className="editorial-workbench-panel">
          <div className="eyebrow">Program</div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900 }}>{item.course_name}</div>
          <p className="muted" style={{ marginTop: 8 }}>{item.student_email}</p>
        </div>
        <div className="editorial-workbench-panel">
          <div className="eyebrow">Payment</div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900 }}>{item.currency} {item.amount_due.toFixed(2)}</div>
          <p className="muted" style={{ marginTop: 8 }}>Stage: {item.payment_stage}</p>
          <p className="muted" style={{ marginTop: 8 }}>
            Gateway: {item.payment_gateway_status || "pending"} {item.payment_mode ? `· ${item.payment_mode}` : ""}
          </p>
        </div>
        <div className="editorial-workbench-panel">
          <div className="eyebrow">Reference</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>{item.payment_reference || "Pending"}</div>
          <p className="muted" style={{ marginTop: 8 }}>Order: {item.payment_order_id || "Not issued"}</p>
          <p className="muted" style={{ marginTop: 8 }}>Gateway payment: {item.payment_gateway_payment_id || "Awaiting capture"}</p>
        </div>
        <div className="editorial-workbench-panel">
          <div className="eyebrow">Enrollment</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>{item.enrollment_stage}</div>
          <p className="muted" style={{ marginTop: 8 }}>Batch: {item.batch_id || "Not assigned yet"}</p>
        </div>
      </div>
      <div className="editorial-workbench-panel" style={{ marginTop: 20 }}>
        <div className="section-head">
          <div className="eyebrow">Verification trail</div>
          <button className="button-secondary" onClick={() => void refreshStatus()} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh status"}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>Reconciliation: {item.payment_reconciliation_status || "not_started"}</p>
        <p className="muted" style={{ marginTop: 8 }}>Order status: {item.payment_gateway_order_status || "not_created"}</p>
        <p className="muted" style={{ marginTop: 8 }}>Verified at: {item.payment_verified_at || "Awaiting verified capture"}</p>
        <p className="muted" style={{ marginTop: 8 }}>Failed at: {item.payment_failed_at || "No failed attempt recorded"}</p>
        <p className="muted" style={{ marginTop: 8 }}>Last checked: {item.payment_last_checked_at || "Not checked yet"}</p>
      </div>
      <div className="editorial-workbench-panel" style={{ marginTop: 20 }}>
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
