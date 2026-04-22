"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type Application = {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  course_name: string;
  application_stage: string;
  payment_stage: string;
  enrollment_stage: string;
  amount_due: number;
  currency: string;
  payment_url?: string | null;
  updated_at: string;
};

export function AdmissionsWorkbench() {
  const [items, setItems] = useState<Application[]>([]);
  const [message, setMessage] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  async function load() {
    if (!sessionToken) return;
    const data = await apiRequest<{ items: Application[] }>(
      `/api/v1/academy/applications/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
      { sessionToken }
    );
    setItems(data.items || []);
  }

  useEffect(() => {
    async function hydrate() {
      await load();
    }
    void hydrate();
    // We only need to react to session changes here; the loader itself is intentionally local to this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  async function issuePaymentLink(id: string) {
    await apiRequest(`/api/v1/academy/applications/${id}/payment-link`, {
      method: "POST",
      body: JSON.stringify({ tenant_name: DEFAULT_TENANT })
    });
    await load();
  }

  async function markEnrolled(id: string) {
    await apiRequest(`/api/v1/academy/applications/${id}/status/secure`, {
      method: "POST",
      sessionToken,
      body: JSON.stringify({
        tenant_name: DEFAULT_TENANT,
        application_stage: "enrolled",
        payment_stage: "paid",
        enrollment_stage: "active"
      })
    });
    await load();
  }

  return (
    <div className="editorial-workbench">
      <section className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Admissions control</div>
        <h2 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          Review every applicant in one queue and move them toward payment or enrollment.
        </h2>
        {message ? (
          <div className="editorial-workbench-panel" style={{ marginTop: 18 }}>{message}</div>
        ) : (
          <p className="editorial-workbench-subtitle">
            This board is for Viva Career Academy operations after the public application has already been submitted.
          </p>
        )}
      </section>

      <section className="editorial-workbench-grid">
        {items.map((item) => (
          <article key={item.id} className="editorial-workbench-card">
            <div className="eyebrow">{item.course_name}</div>
            <h3 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>{item.student_name}</h3>
            <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>{item.student_email}</p>
            <div className="editorial-workbench-meta">
              <span className="editorial-workbench-chip">{item.application_stage}</span>
              <span className="editorial-workbench-chip">{item.payment_stage}</span>
              <span className="editorial-workbench-chip">{item.enrollment_stage}</span>
            </div>
            <div className="button-row">
              <button className="button-secondary" onClick={() => void issuePaymentLink(item.id)}>Issue payment link</button>
              <button className="button-primary" onClick={() => void markEnrolled(item.id)}>Mark enrolled</button>
              {item.payment_url ? <a className="button-secondary" href={item.payment_url} target="_blank" rel="noopener noreferrer">Open checkout</a> : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
