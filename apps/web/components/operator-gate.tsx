"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { defaultRouteForRole, isSessionExpired, readSession, writeSession, type AcademySession } from "../lib/auth";

export function OperatorGate({
  title,
  allowedRoles,
  children
}: {
  title: string;
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AcademySession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => {
      const current = readSession();
      setSession(current);
      if (!current || isSessionExpired(current)) {
        if (current) writeSession(null);
        return;
      }
      void hydrateSession(current);
    };
    sync();
    window.addEventListener("academy-session-changed", sync);
    return () => window.removeEventListener("academy-session-changed", sync);
  }, []);

  async function hydrateSession(current: AcademySession) {
    try {
      const data = await apiRequest<{ session: AcademySession }>(
        `/api/v1/academy/auth/me?tenant_name=${encodeURIComponent(current.tenant_name)}`,
        { session: current }
      );
      writeSession(data.session);
      setSession(data.session);
    } catch {
      writeSession(null);
      setSession(null);
    }
  }

  async function login() {
    if (!email.trim() || !password.trim()) {
      setMessage("Enter your email and password to continue.");
      return;
    }
    setBusy(true);
    setMessage("Signing in...");
    try {
      const data = await apiRequest<{ session: AcademySession }>("/api/v1/academy/auth/login", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          email,
          password,
          expected_role: "operations",
        })
      });
      writeSession(data.session);
      setSession(data.session);
      setMessage("");
      window.location.href = defaultRouteForRole(data.session.role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const current = readSession();
    if (current?.tenant_name) {
      try {
        await apiRequest(`/api/v1/academy/auth/logout?tenant_name=${encodeURIComponent(current.tenant_name)}`, {
          method: "POST",
          session: current,
        });
      } catch {}
    }
    writeSession(null);
    setSession(null);
  }

  if (session && allowedRoles.includes(session.role)) {
    return (
      <div className="editorial-workbench">
        <div className="editorial-workbench-panel">
          <div className="eyebrow">Operator session</div>
          <div className="editorial-workbench-title" style={{ marginTop: 10, fontSize: "1.65rem" }}>{session.full_name} · {session.role}</div>
          <div className="muted" style={{ marginTop: 6 }}>{session.email}</div>
          <button className="button-secondary" style={{ marginTop: 14 }} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Operator access</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2.1rem" }}>{title}</h2>
      <p className="editorial-workbench-subtitle">
        Use an operator account to open the secure VIVA academy surfaces.
      </p>
      <div className="editorial-form-grid" style={{ marginTop: 18 }}>
        <label className="editorial-form-field">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="editorial-input" />
        </label>
        <label className="editorial-form-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="editorial-input" />
        </label>
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void login()} disabled={busy}>
          {busy ? "Signing in" : "Open operator view"}
        </button>
      </div>
      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
