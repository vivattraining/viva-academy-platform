import { ImageResponse } from "next/og";

// Auto-generated 180x180 apple-touch-icon. Eliminates the GET
// /apple-touch-icon.png and /apple-touch-icon-precomposed.png 404s
// that iPhone Safari was triggering (caught by the QA audit on
// mobile-iphone runs).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: "#0a0a0a",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
