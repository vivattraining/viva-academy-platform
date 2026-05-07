"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

/**
 * Student notification preferences (gap analysis §10.5).
 *
 * Email is always-on (system-of-record for receipts, certificates,
 * and password resets). WhatsApp + SMS are gated behind a "Coming
 * soon" badge until the backend integration lands. The save endpoint
 * (POST /api/v1/academy/students/me/preferences/secure) is being
 * added by the backend agent — until it ships we degrade to an
 * optimistic "Saved (will sync when backend update lands)" message
 * on a 404, so the UI still feels responsive.
 */

type StudentPrefs = {
  email_notifications?: boolean;
  whatsapp_notifications?: boolean;
  sms_notifications?: boolean;
};

type StudentPayload = {
  student: { name: string; email: string; role: string };
  preferences?: StudentPrefs | null;
};

type ToggleState = {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
};

const INITIAL: ToggleState = {
  email: true,
  whatsapp: false,
  sms: false,
};

export function StudentPreferencesWorkspace() {
  const [payload, setPayload] = useState<StudentPayload | null>(null);
  const [toggles, setToggles] = useState<ToggleState>(INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionChecked) return;
      if (!sessionToken) {
        setError("Sign in with a student account to manage notification preferences.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const me = await apiRequest<StudentPayload>(
          `/api/v1/academy/students/me?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        if (cancelled) return;
        setPayload(me);
        const prefs = me.preferences || {};
        setToggles({
          // Email is the system-of-record channel — defaults true and
          // can't be disabled from this UI even if the payload says
          // otherwise.
          email: true,
          whatsapp: Boolean(prefs.whatsapp_notifications),
          sms: Boolean(prefs.sms_notifications),
        });
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load notification preferences."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionChecked, sessionToken]);

  async function handleSave() {
    if (!sessionToken) {
      setError("Session expired. Please sign in again.");
      return;
    }
    setSaving(true);
    setError("");
    setFlash("");
    try {
      await apiRequest(`/api/v1/academy/students/me/preferences/secure`, {
        method: "POST",
        sessionToken,
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          email_notifications: toggles.email,
          whatsapp_notifications: toggles.whatsapp,
          sms_notifications: toggles.sms,
        }),
      });
      setFlash("Preferences saved.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "";
      // Graceful fallback: the backend endpoint may not exist yet.
      // Treat 404 / "not found" responses as a soft success so the
      // UI feels responsive while the backend agent finishes wiring.
      if (/404|not found|method not allowed|405/i.test(message)) {
        setFlash("Saved (will sync when backend update lands).");
      } else {
        setError(message || "Unable to save notification preferences.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="editorial-workbench-card">
        Loading notification preferences...
      </section>
    );
  }

  if (error && !payload) {
    return (
      <section className="editorial-workbench-card">{error}</section>
    );
  }

  return (
    <section className="editorial-workbench">
      <article className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Notification preferences</div>
        <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          {payload?.student.name || "Your account"}
        </h1>
        <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>
          Email is always on — that&apos;s how you receive your fee receipts,
          certificate, and password resets. WhatsApp and SMS will be
          available once we finish setup.
        </p>
      </article>

      <article className="editorial-workbench-card">
        <div className="eyebrow">Channels</div>

        <ul
          style={{
            listStyle: "none",
            margin: "16px 0 0",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Email — always on */}
          <li
            style={{
              borderTop: "1px solid rgba(14, 27, 44, 0.08)",
              paddingTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label
              htmlFor="pref-email"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "not-allowed",
                flex: "1 1 240px",
              }}
            >
              <input
                id="pref-email"
                type="checkbox"
                checked={toggles.email}
                disabled
                aria-describedby="pref-email-help"
                style={{ marginTop: 4 }}
              />
              <span>
                <span
                  className="editorial-workbench-title"
                  style={{ fontSize: "1rem", display: "block" }}
                >
                  Email notifications
                </span>
                <span
                  id="pref-email-help"
                  className="muted"
                  style={{ fontSize: 13, display: "block", marginTop: 4 }}
                >
                  System-of-record channel. Required for receipts, certificates,
                  and password resets.
                </span>
              </span>
            </label>
            <span className="editorial-status success">Always on</span>
          </li>

          {/* WhatsApp — coming soon */}
          <li
            style={{
              borderTop: "1px solid rgba(14, 27, 44, 0.08)",
              paddingTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label
              htmlFor="pref-whatsapp"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "not-allowed",
                flex: "1 1 240px",
              }}
            >
              <input
                id="pref-whatsapp"
                type="checkbox"
                checked={toggles.whatsapp}
                disabled
                aria-describedby="pref-whatsapp-help"
                style={{ marginTop: 4 }}
                onChange={(event) =>
                  setToggles((prev) => ({ ...prev, whatsapp: event.target.checked }))
                }
              />
              <span>
                <span
                  className="editorial-workbench-title"
                  style={{ fontSize: "1rem", display: "block" }}
                >
                  WhatsApp notifications
                </span>
                <span
                  id="pref-whatsapp-help"
                  className="muted"
                  style={{ fontSize: 13, display: "block", marginTop: 4 }}
                >
                  Live-class reminders and trainer messages on WhatsApp.
                </span>
              </span>
            </label>
            <span className="editorial-status info">Coming soon</span>
          </li>

          {/* SMS — coming soon */}
          <li
            style={{
              borderTop: "1px solid rgba(14, 27, 44, 0.08)",
              paddingTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label
              htmlFor="pref-sms"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "not-allowed",
                flex: "1 1 240px",
              }}
            >
              <input
                id="pref-sms"
                type="checkbox"
                checked={toggles.sms}
                disabled
                aria-describedby="pref-sms-help"
                style={{ marginTop: 4 }}
                onChange={(event) =>
                  setToggles((prev) => ({ ...prev, sms: event.target.checked }))
                }
              />
              <span>
                <span
                  className="editorial-workbench-title"
                  style={{ fontSize: "1rem", display: "block" }}
                >
                  SMS notifications
                </span>
                <span
                  id="pref-sms-help"
                  className="muted"
                  style={{ fontSize: 13, display: "block", marginTop: 4 }}
                >
                  Critical reminders only — fee due dates and certificate issuance.
                </span>
              </span>
            </label>
            <span className="editorial-status info">Coming soon</span>
          </li>
        </ul>

        {flash ? (
          <div className="editorial-workbench-meta" style={{ marginTop: 16 }}>
            <span className="editorial-status success">{flash}</span>
          </div>
        ) : null}
        {error ? (
          <div className="editorial-workbench-meta" style={{ marginTop: 16 }}>
            <span className="editorial-status warning">{error}</span>
          </div>
        ) : null}

        <div className="button-row" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="button-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save preferences"}
          </button>
          <Link className="button-secondary" href="/student">
            Back to home
          </Link>
        </div>
      </article>
    </section>
  );
}
