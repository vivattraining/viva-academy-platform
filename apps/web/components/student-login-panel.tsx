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
      // Don't clear session on error — the fetch may be aborted by navigation
      // that follows a successful login. requirePaidStudentAccess verifies the
      // JWT independently on every server render.
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage("Enter your student email and password to continue.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address (e.g. name@example.com).");
      return;
    }
    setBusy(true);
    setMessage("Signing in...");
    try {
      const data = await apiRequest<{ session: AcademySession }>("/api/v1/academy/auth/login", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          email: email.trim(),
          password: password.trim(),
          expected_role: "student",
        }),
      });
      writeSession(data.session);
      setMessage("");
      window.location.href = defaultRouteForRole(data.session.role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid email or password.");
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
      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="editorial-form-grid" style={{ marginTop: 18 }}>
          <label className="editorial-form-field">
            <span>Student email</span>
            <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} className="editorial-input" autoComplete="email" required />
          </label>
          <label className="editorial-form-field">
            <span>Password</span>
            <input type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} className="editorial-input" autoComplete="current-password" required />
          </label>
        </div>
        <div className="button-row">
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? "Opening..." : "Enter learner workspace"}
          </button>
        </div>
      </form>
      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
