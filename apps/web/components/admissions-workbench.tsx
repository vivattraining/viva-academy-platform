"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";
import { humanize } from "../lib/humanize";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  async function load() {
    if (!sessionToken) return;
    try {
      const data = await apiRequest<{ items: Application[] }>(
        `/api/v1/academy/applications/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken }
      );
      setItems(data.items || []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load admissions queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function hydrate() {
      if (!sessionToken) {
        setError("Operations session required.");
        setLoading(false);
        return;
      }
      await load();
    }
    void hydrate();
    // We only need to react to session changes here; the loader itself is intentionally local to this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  async function issuePaymentLink(id: string) {
    if (!sessionToken) return;
    setMessage("Generating payment link...");
    try {
      await apiRequest(`/api/v1/academy/applications/${id}/payment-link`, {
        method: "POST",
        sessionToken,
        body: JSON.stringify({ tenant_name: DEFAULT_TENANT })
      });
      setMessage("Payment link issued.");
      await load();
    } catch (issueError) {
      setMessage(issueError instanceof Error ? issueError.message : "Unable to issue payment link.");
    }
  }

  async function markEnrolled(id: string) {
    if (!sessionToken) return;
    setMessage("Marking learner as enrolled...");
    try {
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
      setMessage("Learner marked as enrolled.");
      await load();
    } catch (markError) {
      setMessage(markError instanceof Error ? markError.message : "Unable to update enrollment.");
    }
  }

  if (loading) {
    return <section className="editorial-workbench-card">Loading admissions queue...</section>;
  }

  if (error) {
    return <section className="editorial-workbench-card">{error}</section>;
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
        {!items.length ? (
          <article className="editorial-workbench-card">
            <div className="eyebrow">Admissions queue</div>
            <p className="muted" style={{ marginTop: 12 }}>No applications are waiting in the queue right now.</p>
          </article>
        ) : null}
        {items.map((item) => {
          // Each button reflects whether the action it represents is the
          // current state of the application. When that's true, we use the
          // shared `.button-active` class (clear blue + white text) so the
          // operator can see at a glance what's already been done.
          const isPaid = item.payment_stage === "paid";
          const isEnrolled = item.enrollment_stage === "active" || item.application_stage === "enrolled";
          return (
            <article key={item.id} className="editorial-workbench-card">
              <div className="eyebrow">{item.course_name}</div>
              <h3 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>{item.student_name}</h3>
              <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>{item.student_email}</p>
              <div className="editorial-workbench-meta">
                <span className="editorial-workbench-chip">{humanize(item.application_stage)}</span>
                <span className="editorial-workbench-chip">{humanize(item.payment_stage)}</span>
                <span className="editorial-workbench-chip">{humanize(item.enrollment_stage)}</span>
              </div>
              <div className="button-row">
                <button
                  className={isPaid ? "button-active" : "button-secondary"}
                  aria-pressed={isPaid}
                  onClick={() => void issuePaymentLink(item.id)}
                  title={isPaid ? "Payment already received" : "Issue a Razorpay payment link"}
                >
                  {isPaid ? "Payment received" : "Issue payment link"}
                </button>
                <button
                  className={isEnrolled ? "button-active" : "button-primary"}
                  aria-pressed={isEnrolled}
                  onClick={() => void markEnrolled(item.id)}
                  title={isEnrolled ? "Already enrolled" : "Move this learner into an active batch"}
                  disabled={isEnrolled}
                >
                  {isEnrolled ? "Enrolled" : "Mark enrolled"}
                </button>
                {item.payment_url ? <a className="button-secondary" href={item.payment_url} target="_blank" rel="noopener noreferrer">Open checkout</a> : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
