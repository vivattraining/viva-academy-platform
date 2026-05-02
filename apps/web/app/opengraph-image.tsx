import { ImageResponse } from "next/og";

// 1200x630 Open Graph card. Renders the Editorial V mark, wordmark,
// and a tagline on a cream background with navy + gold accents.
// Used by LinkedIn, WhatsApp, X, Slack, etc. when anyone shares
// a vivacareeracademy.com link. SEO audit (2026-05-01) item #3.
export const alt = "Viva Career Academy · A training institute for the world's most hospitable careers.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5efe4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "ui-serif, Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              border: "5px solid #0B1F3A",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 30,
            }}
          >
            <div
              style={{
                color: "#0B1F3A",
                fontSize: 90,
                fontWeight: 700,
                lineHeight: 1,
                fontFamily: "ui-serif, Georgia, serif",
              }}
            >
              V
            </div>
            <div style={{ width: 50, height: 3, background: "#b8860b", marginTop: 8 }} />
          </div>
          <div
            style={{
              color: "#0B1F3A",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "ui-serif, Georgia, serif",
            }}
          >
            VIVA CAREER ACADEMY
          </div>
          <div style={{ width: 240, height: 2, background: "#b8860b", marginTop: 18 }} />
          <div
            style={{
              color: "#5a5040",
              fontSize: 28,
              marginTop: 22,
              fontStyle: "italic",
              maxWidth: 900,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            A training institute for the world&apos;s most hospitable careers
          </div>
          <div
            style={{
              color: "#5a5040",
              fontSize: 18,
              marginTop: 36,
              letterSpacing: "0.2em",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            EST. 2011 · MUMBAI · DELHI · BANGALORE · GOA
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
