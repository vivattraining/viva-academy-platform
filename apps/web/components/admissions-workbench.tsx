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
    <div className="stack">
      <section className="card">
        <div className="eyebrow">Admissions control</div>
        <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>Review every applicant in one queue and push them toward payment or enrollment.</div>
        {message ? <div className="panel" style={{ marginTop: 16 }}>{message}</div> : <p className="muted" style={{ marginTop: 12 }}>This board is for VIVA operations after the public application has already been submitted.</p>}
      </section>

      <section className="grid grid-2">
        {items.map((item) => (
          <article key={item.id} className="card">
            <div className="eyebrow">{item.course_name}</div>
            <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em" }}>{item.student_name}</div>
            <p className="muted" style={{ marginTop: 8 }}>{item.student_email}</p>
            <p className="muted">{item.application_stage} · {item.payment_stage} · {item.enrollment_stage}</p>
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
