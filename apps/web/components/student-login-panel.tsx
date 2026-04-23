"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { defaultRouteForRole, isSessionExpired, readSession, writeSession, type AcademySession } from "../lib/auth";

export function StudentLoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session || isSessionExpired(session) || session.role !== "student") return;
    void restoreSession(session);
  }, []);

  async function restoreSession(session: AcademySession) {
    try {
      const data = await apiRequest<{ session: AcademySession }>(
        `/api/v1/academy/auth/me?tenant_name=${encodeURIComponent(session.tenant_name)}`,
        { session }
      );
      writeSession(data.session);
    } catch {
      writeSession(null);
    }
  }

  async function login() {
    if (!email.trim() || !password.trim()) {
      setMessage("Enter your student email and password to continue.");
      return;
    }
    setBusy(true);
    setMessage("Opening learner workspace...");
    try {
      const data = await apiRequest<{ session: AcademySession }>("/api/v1/academy/auth/login", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          email,
          password,
        }),
      });
      writeSession(data.session);
      window.location.href = defaultRouteForRole(data.session.role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in as student.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="editorial-workbench-card">
      <div className="eyebrow">Student access</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2.1rem" }}>Open the learner dashboard directly.</h2>
      <p className="editorial-workbench-subtitle">
        Use your student credentials to access schedule, attendance, and classroom visibility without admin clutter.
      </p>
      <div className="editorial-form-grid" style={{ marginTop: 18 }}>
        <label className="editorial-form-field">
          <span>Student email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="editorial-input" />
        </label>
        <label className="editorial-form-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="editorial-input" />
        </label>
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void login()} disabled={busy}>
          {busy ? "Opening..." : "Enter learner workspace"}
        </button>
      </div>
      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
