"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

type TrainerInvite = {
  id: string;
  email: string;
  full_name: string;
  status: InviteStatus;
  created_at?: string;
  expires_at?: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
};

function statusTone(status: InviteStatus): string {
  switch (status) {
    case "accepted":
      return "info";
    case "pending":
      return "neutral";
    case "revoked":
    case "expired":
    default:
      return "warning";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminTrainerInvites() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [toast, setToast] = useState("");

  const [invites, setInvites] = useState<TrainerInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    void loadInvites(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  async function loadInvites(token: string) {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest<{ items: TrainerInvite[] }>(
        `/api/v1/academy/trainers/invites/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken: token }
      );
      setInvites(data.items || []);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load invites."
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite() {
    if (!sessionToken) {
      setSendError("Admin session required.");
      return;
    }
    if (!email.trim() || !fullName.trim()) {
      setSendError("Enter both a name and email.");
      return;
    }
    setSending(true);
    setSendError("");
    try {
      await apiRequest("/api/v1/academy/trainers/invite/secure", {
        method: "POST",
        sessionToken,
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          email: email.trim(),
          full_name: fullName.trim(),
        }),
      });
      setToast(`Invite sent to ${email.trim()}`);
      setEmail("");
      setFullName("");
      await loadInvites(sessionToken);
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Unable to send invite."
      );
    } finally {
      setSending(false);
    }
  }

  async function revoke(invite: TrainerInvite) {
    if (!sessionToken) return;
    if (!window.confirm(`Revoke invite for ${invite.email}?`)) return;
    try {
      await apiRequest(
        `/api/v1/academy/trainers/invites/${encodeURIComponent(invite.id)}/revoke/secure`,
        {
          method: "POST",
          sessionToken,
          body: JSON.stringify({ tenant_name: DEFAULT_TENANT }),
        }
      );
      setToast(`Invite for ${invite.email} revoked.`);
      await loadInvites(sessionToken);
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Unable to revoke invite."
      );
    }
  }

  return (
    <section className="editorial-workbench-card">
      <div className="eyebrow">Trainer invites</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
        Invite trainers to self-serve onboard.
      </h2>
      <p className="editorial-workbench-subtitle">
        The trainer receives an email with a link to set their password and complete a
        profile. Profiles only appear on the public site after an admin approves them.
      </p>

      <div className="editorial-form-grid" style={{ marginTop: 18 }}>
        <label className="editorial-form-field">
          <span>Full name</span>
          <input
            className="editorial-input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
          />
        </label>
        <label className="editorial-form-field">
          <span>Email</span>
          <input
            className="editorial-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="trainer@example.com"
          />
        </label>
      </div>

      <div className="button-row">
        <button
          className="button-primary"
          onClick={() => void sendInvite()}
          disabled={sending}
        >
          {sending ? "Sending…" : "Send invite"}
        </button>
      </div>

      {sendError ? (
        <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
          {sendError}
        </div>
      ) : null}
      {toast ? (
        <div
          className="editorial-workbench-panel"
          style={{
            marginTop: 16,
            background: "#e6f3ea",
            borderColor: "#7fb992",
          }}
        >
          {toast}
        </div>
      ) : null}

      <div style={{ marginTop: 28 }}>
        <div className="eyebrow">Existing invites</div>
        {loading ? (
          <p className="muted" style={{ marginTop: 12 }}>Loading invites…</p>
        ) : loadError ? (
          <p className="muted" style={{ marginTop: 12 }}>{loadError}</p>
        ) : invites.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            No invites yet. Send one above.
          </p>
        ) : (
          <div className="stack" style={{ marginTop: 12 }}>
            {invites.map((invite) => (
              <div key={invite.id} className="editorial-workbench-panel">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block" }}>{invite.full_name}</strong>
                    <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {invite.email}
                    </p>
                    <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                      Sent {formatDate(invite.created_at)}
                      {invite.expires_at ? ` · expires ${formatDate(invite.expires_at)}` : ""}
                    </p>
                  </div>
                  <span className={`editorial-status ${statusTone(invite.status)}`}>
                    {invite.status}
                  </span>
                </div>
                {invite.status === "pending" ? (
                  <div className="button-row" style={{ marginTop: 14 }}>
                    <button
                      className="button-secondary"
                      onClick={() => void revoke(invite)}
                    >
                      Revoke
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
