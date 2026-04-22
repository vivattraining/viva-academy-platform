"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { writeSession, type AcademySession } from "../lib/auth";

export function AdminBootstrapPanel() {
  const [bootstrapRequired, setBootstrapRequired] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<{ bootstrap_required: boolean }>(
          `/api/v1/academy/auth/status?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
        );
        setBootstrapRequired(data.bootstrap_required);
      } catch {
        setBootstrapRequired(false);
      }
    }
    void load();
  }, []);

  async function bootstrap() {
    setMessage("Creating founding admin...");
    try {
      const data = await apiRequest<{ session: AcademySession }>("/api/v1/academy/auth/bootstrap-admin", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          full_name: fullName,
          email,
          password,
        }),
      });
      writeSession(data.session);
      setMessage("Founding admin created. You can now open admin and operator views.");
      setBootstrapRequired(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to bootstrap admin.");
    }
  }

  if (bootstrapRequired === false) {
    return null;
  }

  return (
    <section className="card">
      <div className="eyebrow">Founding admin setup</div>
      <h2 style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>Create the first admin without demo credentials.</h2>
      <p className="muted" style={{ marginTop: 12 }}>
        Use this once for a fresh tenant to create the founding admin account. After that, admin users should be added from the secured platform.
      </p>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }} placeholder="Full name" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }} placeholder="Admin email" />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }} placeholder="Password" />
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void bootstrap()}>Create founding admin</button>
      </div>
      {message ? <div className="panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
