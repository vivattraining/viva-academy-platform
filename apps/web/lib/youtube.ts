/**
 * YouTube URL helpers.
 *
 * Supports the URL shapes faculty are most likely to paste:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *
 * Unlisted YouTube videos work the same way — the URL exposes the
 * video ID, and `youtube-nocookie.com/embed/{id}` plays them inline
 * without enabling YouTube tracking cookies (privacy-enhanced mode).
 */

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    // youtu.be/VIDEO_ID
    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      return seg || null;
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com") ||
        host === "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com")) {
      // /watch?v=VIDEO_ID
      const v = u.searchParams.get("v");
      if (v) return v;
      // /embed/VIDEO_ID, /shorts/VIDEO_ID, /v/VIDEO_ID
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs.length >= 2 && ["embed", "shorts", "v"].includes(segs[0])) {
        return segs[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  // youtube-nocookie.com is YouTube's privacy-enhanced domain.
  // rel=0 hides "More videos" from other channels at end of playback.
  // modestbranding=1 hides the YouTube logo from the controls bar.
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}
