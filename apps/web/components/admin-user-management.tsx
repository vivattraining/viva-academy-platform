"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type UserItem = {
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

const ROLE_OPTIONS = ["admin", "operations", "trainer", "student"] as const;

export function AdminUserManagement() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("operations");
  const [message, setMessage] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    async function load() {
      if (!sessionToken) return;
      const data = await apiRequest<{ items: UserItem[] }>(
        `/api/v1/academy/auth/users/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken }
      );
      setItems(data.items || []);
    }
    void load();
  }, [sessionToken]);

  async function createUser() {
    if (!sessionToken) {
      setMessage("Admin session required.");
      return;
    }
    setMessage("Creating user...");
    try {
      await apiRequest("/api/v1/academy/auth/users/secure", {
        method: "POST",
        sessionToken,
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          full_name: fullName,
          email,
          password,
          role,
        }),
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("operations");
      setMessage("User created.");
      if (sessionToken) {
        const data = await apiRequest<{ items: UserItem[] }>(
          `/api/v1/academy/auth/users/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        setItems(data.items || []);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create user.");
    }
  }

  return (
    <section className="editorial-workbench-card">
      <div className="eyebrow">User management</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
        Create real admin, operations, trainer, and learner accounts.
      </h2>
      <p className="editorial-workbench-subtitle">
        This replaces reliance on seeded logins and gives Viva Career Academy a cleaner access path for launch operations.
      </p>

      <div className="editorial-form-grid" style={{ marginTop: 18 }}>
        <label className="editorial-form-field">
          <span>Full name</span>
          <input className="editorial-input" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
        </label>
        <label className="editorial-form-field">
          <span>Email</span>
          <input className="editorial-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@vivacareeracademy.com" />
        </label>
        <label className="editorial-form-field">
          <span>Password</span>
          <input className="editorial-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" />
        </label>
        <label className="editorial-form-field">
          <span>Role</span>
          <select className="editorial-select" value={role} onChange={(event) => setRole(event.target.value as (typeof ROLE_OPTIONS)[number])}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="button-row">
        <button className="button-primary" onClick={() => void createUser()}>Create user</button>
      </div>

      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}

      <div className="stack" style={{ marginTop: 18 }}>
        {items.map((item) => (
          <div key={item.email} className="editorial-workbench-panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
              <div>
                <strong>{item.full_name}</strong>
                <p className="muted" style={{ marginTop: 6 }}>{item.email}</p>
              </div>
              <div className="editorial-workbench-meta" style={{ marginTop: 0 }}>
                <span className="editorial-workbench-chip">{item.role}</span>
                <span className="editorial-workbench-chip">Created {item.created_at.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
