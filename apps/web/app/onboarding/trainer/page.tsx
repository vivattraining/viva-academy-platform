"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../../../lib/api";
import { writeSession, type AcademySession } from "../../../lib/auth";

type InvitePreview = {
  full_name: string;
  email: string;
  expires_at: string;
};

type AcceptResponse = { session: AcademySession };

const PAGE_BG = "#f5efe4";
const NAVY = "#0B1F3A";
const GOLD = "#b8860b";

function OnboardingTrainerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string>("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoadError("This invite link is missing its token. Ask your admin to resend it.");
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest<InvitePreview>(
          `/api/v1/academy/trainers/invite/${encodeURIComponent(token)}`
        );
        if (cancelled) return;
        setInvite(data);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Invite not found.";
        setLoadError(
          /not found|expired|revoked|404/i.test(message)
            ? "This invite has expired or is invalid. Ask your admin to send a new one."
            : message
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit() {
    if (!invite) return;
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setSubmitError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      const data = await apiRequest<AcceptResponse>("/api/v1/academy/trainers/invite/accept", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          token,
          password,
        }),
      });
      writeSession(data.session);
      router.push("/trainer/profile");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to activate your trainer account."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        color: NAVY,
        fontFamily:
          "'Cormorant Garamond', 'Georgia', 'Times New Roman', serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fffaf2",
          border: `1px solid ${GOLD}33`,
          borderRadius: 18,
          padding: "44px 36px",
          boxShadow: "0 30px 80px rgba(11, 31, 58, 0.10)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: GOLD,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          Trainer onboarding
        </div>
        <h1
          style={{
            fontSize: "2.1rem",
            lineHeight: 1.15,
            margin: "14px 0 6px",
            color: NAVY,
            fontWeight: 500,
          }}
        >
          Activate your VIVA trainer account
        </h1>

        {loading ? (
          <p style={{ marginTop: 24, color: "#42506a", fontSize: 16 }}>
            Verifying your invite…
          </p>
        ) : loadError ? (
          <>
            <p
              style={{
                marginTop: 22,
                color: "#7a3a3a",
                background: "#f7e6e2",
                border: "1px solid #e3b9b1",
                borderRadius: 10,
                padding: "14px 16px",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {loadError}
            </p>
            <div style={{ marginTop: 22 }}>
              <Link
                href="/"
                style={{
                  color: NAVY,
                  textDecoration: "underline",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 14,
                }}
              >
                Return to vivacareeracademy.com
              </Link>
            </div>
          </>
        ) : invite ? (
          <>
            <p
              style={{
                marginTop: 14,
                fontSize: 17,
                lineHeight: 1.5,
                color: "#42506a",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Hi {invite.full_name}, set a password to activate your trainer
              account.
            </p>
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#6b7791",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              You&rsquo;ll sign in as <strong>{invite.email}</strong>.
            </p>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: NAVY,
                }}
              >
                <span style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11, color: "#6b7791" }}>
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  style={{
                    border: `1px solid ${NAVY}22`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 15,
                    background: "white",
                    color: NAVY,
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: NAVY,
                }}
              >
                <span style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11, color: "#6b7791" }}>
                  Confirm password
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  style={{
                    border: `1px solid ${NAVY}22`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 15,
                    background: "white",
                    color: NAVY,
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                />
              </label>
            </div>

            {submitError ? (
              <p
                style={{
                  marginTop: 14,
                  color: "#7a3a3a",
                  background: "#f7e6e2",
                  border: "1px solid #e3b9b1",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                }}
              >
                {submitError}
              </p>
            ) : null}

            <button
              onClick={() => void submit()}
              disabled={busy}
              style={{
                marginTop: 24,
                width: "100%",
                background: NAVY,
                color: "#fffaf2",
                border: "none",
                borderRadius: 999,
                padding: "14px 22px",
                fontSize: 15,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Activating…" : "Activate trainer account"}
            </button>

            <p
              style={{
                marginTop: 20,
                fontSize: 12,
                color: "#6b7791",
                fontFamily: "'Inter', system-ui, sans-serif",
                lineHeight: 1.5,
              }}
            >
              By activating, you agree to act as a faculty member representing
              VIVA Career Academy. This invite expires on{" "}
              {new Date(invite.expires_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              .
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function OnboardingTrainerPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: PAGE_BG,
            color: NAVY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Loading invite…
        </main>
      }
    >
      <OnboardingTrainerInner />
    </Suspense>
  );
}
