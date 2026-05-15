"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { defaultRouteForRole, isSessionExpired, readSession, writeSession, type AcademySession } from "../lib/auth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operations: "Operations",
  trainer: "Trainer",
  student: "Student",
};

const ROLE_ROUTES = [
  { role: "admin", href: "/admin", label: "Admin control tower" },
  { role: "operations", href: "/operations", label: "Operations workbench" },
  { role: "trainer", href: "/trainer", label: "Trainer studio" },
  { role: "student", href: "/student", label: "Student workspace" },
  { role: "operations", href: "/admissions", label: "Admissions pipeline" },
  { role: "admin", href: "/messages", label: "Messaging center" },
  { role: "trainer", href: "/messages", label: "Messaging center" },
  { role: "operations", href: "/roster", label: "Roster desk" },
];

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
  const expectedRole = allowedRoles.length === 1 ? allowedRoles[0] : null;
  const roleLabel = allowedRoles.map((role) => ROLE_LABELS[role] || role).join(", ");
  const signedInRoutes = session
    ? ROLE_ROUTES.filter((item) => item.role === session.role || session.role === "admin").slice(0, 4)
    : [];

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
      // Don't clear the session on error: the fetch is commonly aborted by the
      // navigation that immediately follows a successful login. Wiping the session
      // here would remove the cookie before the GET /admin request is made, forcing
      // a redirect loop. requireInternalPageAccess verifies the JWT independently
      // on every server-rendered page, so stale sessions are caught there.
    }
  }

  async function login() {
    if (!email.trim() || !password.trim()) {
      setMessage("Enter your email and password to continue.");
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
          email,
          password,
          expected_role: expectedRole,
        })
      });
      writeSession(data.session);
      setSession(data.session);
      setMessage("");
      window.location.href = defaultRouteForRole(data.session.role);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to sign in.";
      const isRateLimit = msg.toLowerCase().includes("too many") || msg.includes("429") || msg.toLowerCase().includes("rate limit");
      setIsError(true);
      if (isRateLimit) {
        setRetryAfter(900);
        setMessage("Too many sign-in attempts.");
      } else {
        setMessage(msg);
      }
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
        <section className="editorial-workbench-grid compact">
          <article className="editorial-workbench-panel">
            <div className="eyebrow">Operator session</div>
            <div className="editorial-workbench-title" style={{ marginTop: 10, fontSize: "1.65rem" }}>
              {session.full_name} · {ROLE_LABELS[session.role] || session.role}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>{session.email}</div>
            <div className="editorial-workbench-meta">
              <span className="editorial-workbench-chip">Tenant: {session.tenant_name}</span>
              <span className="editorial-workbench-chip">Expires: {new Date(session.expires_at).toLocaleString()}</span>
            </div>
            <button className="button-secondary" style={{ marginTop: 14 }} onClick={() => void signOut()}>
              Sign out
            </button>
          </article>
          <article className="editorial-workbench-panel">
            <div className="eyebrow">Quick navigation</div>
            <div className="stack" style={{ marginTop: 14 }}>
              {signedInRoutes.map((item) => (
                <Link key={item.href} href={item.href} className="editorial-workbench-panel" style={{ textDecoration: "none", color: "inherit" }}>
                  <strong>{item.label}</strong>
                  <p className="muted" style={{ marginTop: 8 }}>{item.href}</p>
                </Link>
              ))}
            </div>
          </article>
        </section>
        {children}
      </div>
    );
  }

  if (session && !allowedRoles.includes(session.role)) {
    return (
      <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
        <div className="eyebrow">Workspace mismatch</div>
        <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2.1rem" }}>{title}</h2>
        <p className="editorial-workbench-subtitle">
          This surface is reserved for {roleLabel.toLowerCase()} accounts. You are currently signed in as {ROLE_LABELS[session.role] || session.role}.
        </p>
        <div className="button-row">
          <Link className="button-primary" href={defaultRouteForRole(session.role)}>
            Open my workspace
          </Link>
          <button className="button-secondary" onClick={() => void signOut()}>
            Sign out and switch account
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Operator access</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2.1rem" }}>{title}</h2>
      <p className="editorial-workbench-subtitle">
        Use a {roleLabel.toLowerCase()} account to open the secure VIVA academy surfaces.
      </p>
      <div className="editorial-workbench-meta">
        {allowedRoles.map((role) => (
          <span key={role} className="editorial-workbench-chip">{ROLE_LABELS[role] || role}</span>
        ))}
      </div>
      <form
        onSubmit={(event) => { event.preventDefault(); void login(); }}
        autoComplete="on"
      >
        <div className="editorial-form-grid" style={{ marginTop: 18 }}>
          <label className="editorial-form-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="editorial-input" autoComplete="email" required />
          </label>
          <label className="editorial-form-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="editorial-input"
              autoComplete="current-password"
              required
            />
          </label>
        </div>
        <div className="button-row">
          <button
            type="submit"
            className="button-primary"
            disabled={busy || retryAfter > 0}
          >
            {busy ? "Signing in" : "Open operator view"}
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
