import { ImageResponse } from "next/og";

// 32x32 PNG fallback for browsers that don't render SVG favicons
// (Safari < 16). Modern browsers prefer the icon.svg sibling, which
// renders the Editorial V crisply at any size with the Libre Caslon
// serif treatment.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5efe4",
          border: "1.5px solid #0B1F3A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#0B1F3A",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "ui-serif, Georgia, serif",
            lineHeight: 1,
          }}
        >
          V
        </div>
        <div
          style={{
            width: 12,
            height: 1,
            background: "#b8860b",
            marginTop: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
