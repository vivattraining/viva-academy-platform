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
      if (!fullName.trim() || !email.trim() || password.trim().length < 8) {
        setMessage("Enter a full name, valid email, and a password with at least 8 characters.");
        return;
      }
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
    <section className="editorial-workbench-card">
      <div className="eyebrow">Founding admin setup</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>Create the first admin account for this tenant.</h2>
      <p className="editorial-workbench-subtitle">
        Use this once for a fresh tenant. After that, manage staff and learner access from the secured admin platform.
      </p>
      <div className="editorial-form-grid" style={{ marginTop: 18 }}>
        <label className="editorial-form-field">
          <span>Full name</span>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="editorial-input" placeholder="Full name" />
        </label>
        <label className="editorial-form-field">
          <span>Admin email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="editorial-input" placeholder="admin@vivacareeracademy.com" />
        </label>
        <label className="editorial-form-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="editorial-input" placeholder="Minimum 8 characters" />
        </label>
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void bootstrap()}>Create founding admin</button>
      </div>
      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
