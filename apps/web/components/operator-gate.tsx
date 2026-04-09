"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession, writeSession, type AcademySession } from "../lib/auth";

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
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener("academy-session-changed", sync);
    return () => window.removeEventListener("academy-session-changed", sync);
  }, []);

  async function login() {
    setBusy(true);
    setMessage("Signing in...");
    try {
      const data = await apiRequest<{ session: AcademySession }>("/api/v1/academy/auth/login", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          email,
          password
        })
      });
      writeSession(data.session);
      setSession(data.session);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (session && allowedRoles.includes(session.role)) {
    return (
      <div className="stack">
        <div className="panel" style={{ background: "#ECFDF3" }}>
          <div className="eyebrow">Operator session</div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>{session.full_name} · {session.role}</div>
          <div className="muted" style={{ marginTop: 6 }}>{session.email}</div>
          <button className="button-secondary" style={{ marginTop: 14 }} onClick={() => writeSession(null)}>
            Sign out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Operator access</div>
      <h2 style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>{title}</h2>
      <p className="muted" style={{ marginTop: 12 }}>
        Use an operator account to open the secure VIVA academy surfaces.
      </p>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <label className="stack">
          <span className="eyebrow">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }} />
        </label>
        <label className="stack">
          <span className="eyebrow">Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pill" style={{ borderRadius: 20, textTransform: "none", letterSpacing: "normal", fontWeight: 600 }} />
        </label>
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void login()} disabled={busy}>
          {busy ? "Signing in" : "Open operator view"}
        </button>
      </div>
      {message ? <div className="panel" style={{ marginTop: 16, background: "#FEF2F2" }}>{message}</div> : null}
    </section>
  );
}
