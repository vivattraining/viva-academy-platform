"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

type Certificate = {
  id: string;
  application_id: string;
  course_id: string | null;
  course_code: string;
  course_name: string;
  student_name: string;
  student_email: string;
  cohort_label: string;
  score_pct: number | null;
  passed: boolean;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  verification_token: string;
  notes: string;
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
}

export function AdminCertificateManager() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState({ application_id: "", course_id: "", notes: "" });
  const [issuing, setIssuing] = useState(false);

  async function load() {
    try {
      const data = await apiRequest<{ items: Certificate[] }>(
        `/api/v1/academy/certificates/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
      );
      setItems(data.items || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load certificates.");
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function issueManually() {
    if (!issueForm.application_id.trim()) {
      setError("Application ID is required.");
      return;
    }
    setIssuing(true);
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/v1/academy/certificates/issue/secure", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          application_id: issueForm.application_id.trim(),
          course_id: issueForm.course_id.trim() || undefined,
          notes: issueForm.notes.trim(),
        }),
      });
      setIssueForm({ application_id: "", course_id: "", notes: "" });
      setMessage("Certificate issued.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to issue certificate.");
    } finally {
      setIssuing(false);
    }
  }

  async function revoke(cert: Certificate) {
    const reason = prompt(`Revoke certificate for ${cert.student_name}? Reason:`);
    if (reason === null) return;
    setBusyId(cert.id);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/v1/academy/certificates/${encodeURIComponent(cert.id)}/revoke/secure`, {
        method: "POST",
        body: JSON.stringify({ tenant_name: DEFAULT_TENANT, reason: reason.trim() }),
      });
      setMessage(`Revoked ${cert.student_name}'s certificate.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Certificate management</div>
      <h3 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "1.4rem" }}>
        Issue, list, and revoke certificates
      </h3>
      <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
        Certificates are auto-issued when a student passes the certification
        test. Use the form below for manual overrides — waivers, backfills,
        or grading exceptions. Revoked certificates fail public verification
        immediately.
      </p>

      <h4 style={{ marginTop: 20, fontSize: "1.05rem", fontWeight: 600 }}>Issue manually</h4>
      <div style={{ marginTop: 10, display: "grid", gap: 10, gridTemplateColumns: "1fr" }}>
        <label className="editorial-field">
          <span>Application ID</span>
          <input
            type="text"
            placeholder="acad_..."
            value={issueForm.application_id}
            onChange={(e) => setIssueForm({ ...issueForm, application_id: e.target.value })}
          />
        </label>
        <label className="editorial-field">
          <span>Course ID (optional — auto-resolved from application if blank)</span>
          <input
            type="text"
            placeholder="course_..."
            value={issueForm.course_id}
            onChange={(e) => setIssueForm({ ...issueForm, course_id: e.target.value })}
          />
        </label>
        <label className="editorial-field">
          <span>Notes (optional, for internal record)</span>
          <textarea
            rows={2}
            placeholder="e.g. Waiver — student passed live oral exam; written test waived per VK."
            value={issueForm.notes}
            onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
          />
        </label>
        <div>
          <button className="button-primary" onClick={() => void issueManually()} disabled={issuing}>
            {issuing ? "Issuing…" : "Issue certificate"}
          </button>
        </div>
      </div>

      <h4 style={{ marginTop: 24, fontSize: "1.05rem", fontWeight: 600 }}>
        Issued certificates ({items.length})
      </h4>

      {loading ? (
        <p className="muted" style={{ marginTop: 12 }}>Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          No certificates issued yet. The first one will appear here when a student passes the test.
        </p>
      ) : (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
                <th style={{ padding: "8px 10px 8px 0", fontWeight: 600 }}>Student</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Course</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Score</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Issued</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "8px 0 8px 10px", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <td style={{ padding: "8px 10px 8px 0" }}>
                    <div style={{ fontWeight: 500 }}>{c.student_name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.student_email}</div>
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{c.course_code}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.cohort_label}</div>
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {typeof c.score_pct === "number" ? `${Math.round(c.score_pct)}%` : "—"}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", color: "var(--muted, #2f3140)" }}>
                    {formatTimestamp(c.issued_at)}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {c.revoked_at ? (
                      <span style={{ color: "#9b1c2c", fontSize: 12 }}>
                        Revoked
                        {c.revoked_reason ? ` · ${c.revoked_reason}` : ""}
                      </span>
                    ) : (
                      <span style={{ color: "#1f7a3a", fontSize: 12, fontWeight: 500 }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 0 8px 10px", whiteSpace: "nowrap" }}>
                    <a
                      href={`/certificates/${c.verification_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginRight: 10, fontSize: 12, color: "#1f4ed8" }}
                    >
                      View ↗
                    </a>
                    {!c.revoked_at ? (
                      <button
                        className="button-secondary"
                        onClick={() => void revoke(c)}
                        disabled={busyId === c.id}
                        style={{ fontSize: 12, padding: "4px 10px" }}
                      >
                        {busyId === c.id ? "…" : "Revoke"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error ? <p style={{ marginTop: 12, fontSize: 13, color: "#9b1c2c" }}>{error}</p> : null}
      {message ? <p style={{ marginTop: 12, fontSize: 13, color: "#1f7a3a" }}>{message}</p> : null}
    </section>
  );
}
