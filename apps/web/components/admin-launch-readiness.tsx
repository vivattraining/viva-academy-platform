"use client";

import { useEffect, useState } from "react";

import { apiBaseUrl } from "../lib/api";

type ReadinessResponse = {
  status: string;
  mode: string;
  blockers: string[];
  checks: Record<string, { configured: boolean; enabled?: boolean; engine?: string }>;
  timestamp: string;
};

export function AdminLaunchReadiness() {
  const [payload, setPayload] = useState<ReadinessResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${apiBaseUrl()}/api/v1/readiness`);
        const data = (await response.json()) as ReadinessResponse;
        if (!response.ok) {
          throw new Error("Unable to load readiness state.");
        }
        setPayload(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load readiness state.");
      }
    }
    void load();
  }, []);

  if (error) {
    return <section className="editorial-workbench-card">{error}</section>;
  }

  if (!payload) {
    return <section className="editorial-workbench-card">Loading launch readiness…</section>;
  }

  return (
    <section className="editorial-workbench-card">
      <div className="eyebrow">Launch readiness</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
        Production hookup status for tomorrow’s cutover.
      </h2>
      <p className="editorial-workbench-subtitle">
        This shows which providers are configured in the active backend environment and which ones still block launch readiness.
      </p>
      <div className="editorial-workbench-meta">
        <span className={`editorial-status ${payload.blockers.length ? "warning" : "success"}`}>
          {payload.blockers.length ? "Attention required" : "Ready"}
        </span>
        <span className="editorial-workbench-chip">Mode {payload.mode}</span>
        <span className="editorial-workbench-chip">Checked {payload.timestamp.slice(0, 16).replace("T", " ")}</span>
      </div>

      <div className="editorial-workbench-grid" style={{ marginTop: 18 }}>
        {Object.entries(payload.checks).map(([name, check]) => (
          <div key={name} className="editorial-workbench-panel">
            <strong style={{ textTransform: "capitalize" }}>{name.replaceAll("_", " ")}</strong>
            <div style={{ marginTop: 12 }}>
              <span className={`editorial-status ${check.configured ? "success" : "neutral"}`}>
                {check.configured ? "Configured" : "Missing"}
              </span>
            </div>
            {typeof check.enabled === "boolean" ? (
              <p className="muted" style={{ marginTop: 10 }}>Enabled: {check.enabled ? "Yes" : "No"}</p>
            ) : null}
            {check.engine ? <p className="muted" style={{ marginTop: 10 }}>Engine: {check.engine}</p> : null}
          </div>
        ))}
      </div>

      {payload.blockers.length ? (
        <div className="editorial-workbench-panel" style={{ marginTop: 18 }}>
          <strong>Current blockers</strong>
          <p className="muted" style={{ marginTop: 8 }}>{payload.blockers.join(", ")}</p>
        </div>
      ) : null}
    </section>
  );
}
