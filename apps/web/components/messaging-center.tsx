"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type MessageItem = {
  id: string;
  channel: string;
  audience: string;
  purpose: string;
  status: string;
  trigger: string;
  template: string;
  last_sent_at?: string;
  note?: string;
};

export function MessagingCenter() {
  const [items, setItems] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  async function loadMessages(sessionToken: string) {
    const data = await apiRequest<{ items: MessageItem[] }>(
      `/api/v1/academy/messages/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
      { sessionToken }
    );
    setItems(data.items);
  }

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    async function load() {
      if (!sessionToken) {
        setError("Sign in as an operator to review messaging queues.");
        setLoading(false);
        return;
      }
      try {
        await loadMessages(sessionToken);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load message recommendations.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [sessionToken]);

  const counts = useMemo(() => {
    return {
      email: items.filter((item) => item.channel === "email").length,
      whatsapp: items.filter((item) => item.channel === "whatsapp").length,
      zoom: items.filter((item) => item.channel === "zoom").length,
    };
  }, [items]);

  async function dispatch(item: MessageItem) {
    if (!sessionToken) {
      setError("Session expired. Please sign in again.");
      return;
    }

    setActiveId(item.id);
    setFlash("");
    try {
      await apiRequest(`/api/v1/academy/messages/dispatch/secure`, {
        method: "POST",
        sessionToken,
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          message_id: item.id,
          channel: item.channel,
          audience: item.audience,
          purpose: item.purpose,
          template: item.template,
        }),
      });
      await loadMessages(sessionToken);
      setFlash(`${item.channel.toUpperCase()} dispatch recorded for ${item.audience}.`);
    } catch (dispatchError) {
      setError(dispatchError instanceof Error ? dispatchError.message : "Unable to dispatch the message.");
    } finally {
      setActiveId(null);
    }
  }

  if (loading) {
    return <section className="editorial-workbench-card">Loading messaging center...</section>;
  }

  if (error) {
    return <section className="editorial-workbench-card">{error}</section>;
  }

  return (
    <div className="editorial-workbench">
      <section className="split">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Delivery control</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "2.25rem" }}>
            Email, WhatsApp, and Zoom reminder workflows now move from queue to action.
          </h2>
          <p className="editorial-workbench-subtitle">
            Operators can trigger the right message directly from this surface, while keeping the queue grounded in application and class state.
          </p>
          {flash ? <div className="editorial-workbench-panel" style={{ marginTop: 18, background: "rgba(255,255,255,0.12)", color: "white" }}>{flash}</div> : null}
        </article>
        <article className="editorial-workbench-card">
          <div className="section-head">
            <div className="eyebrow">Message counts</div>
            <div className="editorial-workbench-title" style={{ fontSize: "2rem" }}>{items.length} recommended actions</div>
          </div>
          <div className="badge-row">
            <div className="badge">{counts.email} Email</div>
            <div className="badge">{counts.whatsapp} WhatsApp</div>
            <div className="badge">{counts.zoom} Zoom</div>
          </div>
        </article>
      </section>

      <section className="editorial-workbench-grid">
        {!items.length ? (
          <article className="editorial-workbench-card">
            <div className="eyebrow">Message queue</div>
            <p className="muted" style={{ marginTop: 12 }}>No messaging actions are waiting right now.</p>
          </article>
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="editorial-workbench-card">
            <div className="badge-row">
              <div className="badge">{item.channel}</div>
              <div className="badge">{item.status}</div>
            </div>
            <div className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "1.8rem" }}>{item.purpose}</div>
            <p className="muted" style={{ marginTop: 12 }}>Audience: {item.audience}</p>
            <p className="muted" style={{ marginTop: 8 }}>Trigger: {item.trigger}</p>
            <p className="muted" style={{ marginTop: 8 }}>Template: {item.template}</p>
            {item.last_sent_at ? <p className="muted" style={{ marginTop: 8 }}>Last sent: {item.last_sent_at}</p> : null}
            {item.note ? <p className="muted" style={{ marginTop: 8 }}>{item.note}</p> : null}
            <div className="button-row">
              <button className="button-primary" onClick={() => void dispatch(item)} disabled={activeId === item.id}>
                {activeId === item.id ? "Sending..." : `Send ${item.channel}`}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
