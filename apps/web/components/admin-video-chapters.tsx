"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { extractYouTubeId } from "../lib/youtube";

type Chapter = {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  position: number;
  content_type: string;
  video_url?: string;
};

type Module = {
  id: string;
  title: string;
  week_number: number;
  chapters: Chapter[];
};

type CourseOutline = {
  course: { id: string; code: string; title: string };
  modules: Module[];
};

type CoursesResponse = {
  items: CourseOutline[];
};

type FlatChapter = Chapter & {
  course_code: string;
  course_title: string;
  module_title: string;
  module_week: number;
};

export function AdminVideoChapters() {
  const [outlines, setOutlines] = useState<CourseOutline[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiRequest<CoursesResponse>(
          `/api/v1/academy/courses/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
        );
        if (cancelled) return;
        setOutlines(data.items || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // Flatten the outline tree to a single list of video/guest_speaker chapters.
  const videoChapters = useMemo<FlatChapter[]>(() => {
    const flat: FlatChapter[] = [];
    for (const outline of outlines) {
      for (const mod of outline.modules || []) {
        for (const ch of mod.chapters || []) {
          if (ch.content_type === "video" || ch.content_type === "guest_speaker") {
            flat.push({
              ...ch,
              course_code: outline.course.code,
              course_title: outline.course.title,
              module_title: mod.title,
              module_week: mod.week_number,
            });
          }
        }
      }
    }
    flat.sort((a, b) => {
      if (a.course_code !== b.course_code) return a.course_code.localeCompare(b.course_code);
      if (a.module_week !== b.module_week) return a.module_week - b.module_week;
      return a.position - b.position;
    });
    return flat;
  }, [outlines]);

  function getDraft(chapterId: string, current: string): string {
    return drafts[chapterId] !== undefined ? drafts[chapterId] : current;
  }

  function setDraft(chapterId: string, value: string) {
    setDrafts((prev) => ({ ...prev, [chapterId]: value }));
  }

  function isValidOrEmpty(url: string): boolean {
    if (!url) return true; // empty is OK — clears the field
    return !!extractYouTubeId(url);
  }

  async function saveChapter(chapter: FlatChapter) {
    const draft = getDraft(chapter.id, chapter.video_url || "").trim();
    if (!isValidOrEmpty(draft)) {
      setError(`Invalid YouTube URL for "${chapter.title}". Paste a watch / youtu.be / embed URL.`);
      return;
    }
    setSavingId(chapter.id);
    setError("");
    setMessage("");
    try {
      const data = await apiRequest<{ ok: boolean; item: Chapter }>(
        `/api/v1/academy/course-chapters/${encodeURIComponent(chapter.id)}/secure`,
        {
          method: "PATCH",
          body: JSON.stringify({ tenant_name: DEFAULT_TENANT, video_url: draft }),
        }
      );
      // Update outlines locally so the UI reflects the saved value.
      setOutlines((prev) => prev.map((outline) => ({
        ...outline,
        modules: outline.modules.map((mod) => ({
          ...mod,
          chapters: mod.chapters.map((ch) => ch.id === chapter.id ? { ...ch, video_url: data.item.video_url } : ch),
        })),
      })));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[chapter.id];
        return next;
      });
      setMessage(`Saved "${chapter.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Chapter videos</div>
      <h3 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "1.4rem" }}>
        YouTube unlisted URLs
      </h3>
      <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
        Paste a YouTube URL for any video or guest-speaker chapter. Students
        see the embedded player on next page load. Leave blank to show the
        &ldquo;video coming soon&rdquo; placeholder.
      </p>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading chapters…</p>
      ) : videoChapters.length === 0 ? (
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          No video or guest-speaker chapters found yet. Trigger the P·01 import
          first, or create chapters with content_type &ldquo;video&rdquo; or
          &ldquo;guest_speaker&rdquo;.
        </p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
          {videoChapters.map((chapter) => {
            const draft = getDraft(chapter.id, chapter.video_url || "");
            const dirty = draft !== (chapter.video_url || "");
            const valid = isValidOrEmpty(draft);
            const videoId = extractYouTubeId(draft);
            return (
              <div
                key={chapter.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 6,
                  border: "0.5px solid #d8cfbe",
                  background: "var(--color-background-secondary, #f5efe4)",
                }}
              >
                <div className="muted" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent, #b8860b)" }}>
                  {chapter.course_code} · Week {chapter.module_week} · {chapter.content_type === "guest_speaker" ? "Guest speaker" : "Video"}
                </div>
                <div style={{ marginTop: 4, fontWeight: 500, fontSize: 14 }}>{chapter.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{chapter.module_title}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="url"
                    placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                    value={draft}
                    onChange={(e) => setDraft(chapter.id, e.target.value)}
                    style={{ flex: "1 1 280px", minWidth: 0 }}
                  />
                  <button
                    className="button-primary"
                    onClick={() => void saveChapter(chapter)}
                    disabled={!dirty || !valid || savingId === chapter.id}
                  >
                    {savingId === chapter.id ? "Saving…" : "Save"}
                  </button>
                </div>
                {!valid && draft ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#9b1c2c" }}>
                    Doesn&apos;t look like a YouTube URL — should contain a video ID.
                  </div>
                ) : null}
                {valid && videoId ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#1f7a3a" }}>
                    Detected video ID: <code style={{ fontFamily: "ui-monospace, monospace" }}>{videoId}</code>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {error ? <p style={{ marginTop: 12, fontSize: 13, color: "#9b1c2c" }}>{error}</p> : null}
      {message ? <p style={{ marginTop: 12, fontSize: 13, color: "#1f7a3a" }}>{message}</p> : null}
    </section>
  );
}
