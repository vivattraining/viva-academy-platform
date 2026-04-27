import { ImageResponse } from "next/og";

// Auto-generated favicon for the Viva Career Academy site.
// Eliminates the GET /favicon.ico 404 surfaced by the QA audit.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#0a0a0a",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
