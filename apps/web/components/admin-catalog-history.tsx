"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

type CatalogChangeEvent = {
  id: number;
  detected_at: string;
  course_code: string;
  field: string;
  before_value: string | null;
  after_value: string | null;
  commit_sha: string | null;
  commit_message: string | null;
};

const FIELD_LABEL: Record<string, string> = {
  name: "Course name",
  fee_inr: "Fee (₹)",
  duration_label: "Duration",
  format_label: "Format",
  cohort_label: "Cohort date",
  coming_soon: "Coming-soon flag",
  reservation_fee_inr: "Reservation fee (₹)",
  title_lead: "Card title (line 1)",
  title_emphasis: "Card title (line 2)",
  description: "Marketing description",
  "*added*": "Course added",
  "*removed*": "Course removed",
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
}

function truncate(value: string | null, max = 80): string {
  if (!value) return "—";
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + "…";
}

export function AdminCatalogHistory() {
  const [events, setEvents] = useState<CatalogChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiRequest<{ items: CatalogChangeEvent[] }>(
          `/api/v1/academy/courses/changes/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}&limit=200`
        );
        if (!cancelled) {
          setEvents(data.items || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load catalog history.");
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Catalog history</div>
      <h3 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "1.4rem" }}>
        Course price &amp; content changes
      </h3>
      <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
        Every edit to <code>course_catalog.py</code> on each deploy. Captures
        what changed, when, and the commit message — visible to admins as a
        record-keeping audit trail.
      </p>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading...</p>
      ) : error ? (
        <p style={{ marginTop: 16, color: "#9b1c2c", fontSize: 13 }}>{error}</p>
      ) : events.length === 0 ? (
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          No changes recorded yet. The first edit to a course in the catalog
          will appear here within seconds of the deploy.
        </p>
      ) : (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
                <th style={{ padding: "8px 10px 8px 0", fontWeight: 600 }}>When</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Course</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Field</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Before</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>After</th>
                <th style={{ padding: "8px 0 8px 10px", fontWeight: 600 }}>Commit</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <td style={{ padding: "8px 10px 8px 0", whiteSpace: "nowrap", color: "var(--muted, #2f3140)" }}>
                    {formatTimestamp(event.detected_at)}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontFamily: "ui-monospace, monospace" }}>
                    {event.course_code}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {FIELD_LABEL[event.field] || event.field}
                  </td>
                  <td style={{ padding: "8px 10px", color: "#9b1c2c" }}>
                    {truncate(event.before_value)}
                  </td>
                  <td style={{ padding: "8px 10px", color: "#1f7a3a", fontWeight: 500 }}>
                    {truncate(event.after_value)}
                  </td>
                  <td style={{ padding: "8px 0 8px 10px", color: "var(--muted, #2f3140)" }}>
                    {event.commit_sha ? (
                      <span title={event.commit_message || ""} style={{ fontFamily: "ui-monospace, monospace" }}>
                        {event.commit_sha.slice(0, 7)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
