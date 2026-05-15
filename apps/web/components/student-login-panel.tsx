"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { defaultRouteForRole, isSessionExpired, readSession, writeSession, type AcademySession } from "../lib/auth";

export function StudentLoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

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
    setIsError(false);
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
      const msg = error instanceof Error ? error.message : "Invalid email or password.";
      const isRateLimit = msg.toLowerCase().includes("too many") || msg.includes("429") || msg.toLowerCase().includes("rate limit");
      setIsError(true);
      if (isRateLimit) {
        setRetryAfter(900);
        setMessage("Too many sign-in attempts.");
      } else {
        setMessage(msg);
      }
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
          <button type="submit" className="button-primary" disabled={busy || retryAfter > 0}>
            {busy ? "Opening..." : "Enter learner workspace"}
          </button>
        </div>
      </form>
      {retryAfter > 0 ? (
        <div role="alert" className="editorial-workbench-panel" style={{ marginTop: 16, borderLeft: "3px solid #a23a3a", color: "#a23a3a" }}>
          Too many sign-in attempts. Please wait{" "}
          <strong>{Math.floor(retryAfter / 60)}:{String(retryAfter % 60).padStart(2, "0")}</strong>{" "}
          before trying again.
        </div>
      ) : message && !busy ? (
        <div
          role="alert"
          className="editorial-workbench-panel"
          style={{
            marginTop: 16,
            ...(isError ? { borderLeft: "3px solid #a23a3a", color: "#a23a3a" } : {}),
          }}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}
