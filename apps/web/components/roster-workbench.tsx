"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type Application = {
  id: string;
  student_name: string;
  student_email: string;
  enrollment_stage: string;
  attendance_completed: number;
  attendance_total: number;
  certificate_url?: string | null;
};

export function RosterWorkbench() {
  const [items, setItems] = useState<Application[]>([]);
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

  const enrolled = useMemo(() => items.filter((item) => item.enrollment_stage === "active" || item.enrollment_stage === "completed"), [items]);

  async function issueCertificate(item: Application) {
    await apiRequest(`/api/v1/academy/applications/${item.id}/status/secure`, {
      method: "POST",
      sessionToken,
      body: JSON.stringify({
        tenant_name: DEFAULT_TENANT,
        application_stage: "certificate_issued",
        enrollment_stage: "completed",
        certificate_url: `https://academy.vivacareeracademy.com/certificates/${item.id}`
      })
    });
    await load();
  }

  return (
    <section className="grid grid-2">
      {enrolled.map((item) => (
        <article key={item.id} className="card">
          <div className="eyebrow">{item.student_name}</div>
          <p className="muted" style={{ marginTop: 8 }}>{item.student_email}</p>
          <div className="metric" style={{ marginTop: 12 }}>{item.attendance_completed}/{item.attendance_total}</div>
          <div className="button-row">
            <button className="button-primary" onClick={() => void issueCertificate(item)}>Issue certificate</button>
            {item.certificate_url ? <a className="button-secondary" href={item.certificate_url} target="_blank" rel="noopener noreferrer">View certificate</a> : null}
          </div>
        </article>
      ))}
    </section>
  );
}
