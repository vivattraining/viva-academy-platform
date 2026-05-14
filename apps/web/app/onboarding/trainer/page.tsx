import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSessionExpired, parseSessionCookie, SESSION_COOKIE } from "../../../lib/auth";
import OnboardingTrainerPanel from "../../../components/onboarding-trainer-panel";

export default async function OnboardingTrainerPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const hasToken = Boolean((searchParams.token ?? "").trim());

  if (!hasToken) {
    const cookieStore = await cookies();
    const session = parseSessionCookie(
      cookieStore.get(SESSION_COOKIE)?.value ?? null,
    );
    if (
      !session ||
      isSessionExpired(session) ||
      !["trainer", "admin"].includes(session.role)
    ) {
      redirect("/internal/login");
    }
  }

  return <OnboardingTrainerPanel />;
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
      {/* Without a valid invite, this page shows a minimal "invalid link"
          panel — NOT the onboarding wizard chrome. Three layers of defense:
          (1) wizard form only renders when `invite` resolves on the server,
          (2) `submit()` early-returns if !invite, (3) the backend
          POST /trainers/invite/accept verifies the token server-side. */}
      {!loading && loadError ? (
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#fffaf2",
            border: `1px solid ${NAVY}1a`,
            borderRadius: 14,
            padding: "36px 32px",
            boxShadow: "0 20px 60px rgba(11, 31, 58, 0.08)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#6b7791",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            Invite required
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              lineHeight: 1.2,
              margin: "12px 0 14px",
              color: NAVY,
              fontWeight: 500,
            }}
          >
            This invite link is not valid
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "#42506a",
              fontFamily: "'Inter', system-ui, sans-serif",
              margin: 0,
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
                fontSize: 13,
              }}
            >
              Return to vivacareeracademy.com
            </Link>
          </div>
        </div>
      ) : (
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
      )}
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
