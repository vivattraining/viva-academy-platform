import { ImageResponse } from "next/og";

// 180x180 apple-touch-icon for iOS home-screen / Safari pinned tab.
// Editorial composition: cream surface, navy serif V, gold hairline
// underline. Mirrors the Option 1 logo concept selected for the brand.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5efe4",
          border: "6px solid #0B1F3A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#0B1F3A",
            fontSize: 120,
            fontWeight: 700,
            fontFamily: "ui-serif, Georgia, serif",
            lineHeight: 1,
          }}
        >
          V
        </div>
        <div
          style={{
            width: 70,
            height: 4,
            background: "#b8860b",
            marginTop: 12,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
