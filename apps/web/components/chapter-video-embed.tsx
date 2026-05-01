"use client";

import { youtubeEmbedUrl } from "../lib/youtube";

/**
 * Renders a YouTube (unlisted-friendly) video for a chapter.
 *
 * Used by the student LMS for chapters with content_type
 * "video" or "guest_speaker". When the URL is missing or invalid,
 * shows a polite placeholder — the chapter still progresses, faculty
 * can fill the URL later via the curriculum JSON or admin UI.
 */
export function ChapterVideoEmbed({
  url,
  title,
  contentType,
}: {
  url: string;
  title: string;
  contentType: string;
}) {
  const embed = youtubeEmbedUrl(url);
  const isGuest = contentType === "guest_speaker";
  const label = isGuest ? "Guest speaker session" : "Video lesson";

  if (!embed) {
    return (
      <div
        style={{
          padding: "20px 22px",
          borderRadius: 8,
          background: "rgba(244, 180, 0, 0.10)",
          border: "1px solid rgba(244, 180, 0, 0.32)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "#7a5b00",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#0B1F3A" }}>
          {label} · video coming soon
        </div>
        <div>
          Faculty are preparing the recording for this chapter. You can
          continue with the chapter notes below — the video will be added
          here once available.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent, #b8860b)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 8,
          overflow: "hidden",
          background: "#000",
          border: "1px solid rgba(11, 31, 58, 0.22)",
        }}
      >
        <iframe
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>
    </div>
  );
}
