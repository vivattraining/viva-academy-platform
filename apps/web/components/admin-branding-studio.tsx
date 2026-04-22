"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type Branding = {
  tenant_name: string;
  brand_name: string;
  academy_name: string;
  custom_domain: string;
  primary_color: string;
  accent_color: string;
  support_email: string;
  certificate_name: string;
  classroom_provider: string;
  zoom_host_email: string;
  zoom_default_timezone: string;
};

export function AdminBrandingStudio() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [message, setMessage] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    async function load() {
      const data = await apiRequest<{ branding: Branding }>(`/api/v1/academy/tenants/${encodeURIComponent(DEFAULT_TENANT)}`);
      setBranding(data.branding);
    }
    void load();
  }, []);

  async function save() {
    if (!branding) return;
    setMessage("Saving branding...");
    try {
      await apiRequest("/api/v1/academy/tenants/branding/secure", {
        method: "POST",
        sessionToken,
        body: JSON.stringify(branding)
      });
      setMessage("Branding saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save branding.");
    }
  }

  if (!branding) return <section className="editorial-workbench-card">Loading branding…</section>;

  return (
    <section className="editorial-workbench-card">
      <div className="eyebrow">Branding studio</div>
      <div className="editorial-form-grid" style={{ marginTop: 18 }}>
        {[
          ["brand_name", "Brand name"],
          ["academy_name", "Academy name"],
          ["custom_domain", "Custom domain"],
          ["support_email", "Support email"],
          ["certificate_name", "Certificate name"],
          ["zoom_host_email", "Zoom host email"],
          ["zoom_default_timezone", "Zoom timezone"]
        ].map(([key, label]) => (
          <label key={key} className="editorial-form-field">
            <span>{label}</span>
            <input
              value={(branding as Record<string, string>)[key]}
              onChange={(event) => setBranding((current) => current ? { ...current, [key]: event.target.value } : current)}
              className="editorial-input"
            />
          </label>
        ))}
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void save()}>Save branding</button>
      </div>
      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
