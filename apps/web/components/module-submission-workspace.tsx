"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";
import { ChapterVideoEmbed } from "./chapter-video-embed";
import { ChapterRichText } from "./chapter-rich-text";

type ChapterShape = {
  id: string;
  title: string;
  summary: string;
  question_prompt: string;
  status: string;
  content_type?: string;
  video_url?: string;
  lesson_id?: string;
  submission?: { answer_text?: string | null } | null;
};

type LessonShape = {
  id: string;
  title: string;
  position: number;
  summary: string;
  auto_created?: boolean;
  chapters: ChapterShape[];
};

type StudentLmsPayload = {
  application: { id: string };
  lms: {
    course: { id: string; title: string };
    modules: Array<{
      id: string;
      title: string;
      status: string;
      chapters: ChapterShape[];
      // 4-level layer (Path B): lessons within a module. When the
      // module has only one auto-created Main lesson, the LMS renders
      // chapters flat — see is_auto_grouped flag from backend.
      lessons?: LessonShape[];
      is_auto_grouped?: boolean;
    }>;
  };
};

export function ModuleSubmissionWorkspace({ moduleId }: { moduleId: string }) {
  const [payload, setPayload] = useState<StudentLmsPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    async function load() {
      if (!sessionToken) {
        setError("Student session required to open the module workspace.");
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest<StudentLmsPayload>(
          `/api/v1/academy/students/me/lms?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        setPayload(data);
        const nextAnswers: Record<string, string> = {};
        for (const moduleItem of data.lms.modules) {
          for (const chapter of moduleItem.chapters) {
            nextAnswers[chapter.id] = chapter.submission?.answer_text || "";
          }
        }
        setAnswers(nextAnswers);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load module workspace.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [sessionToken]);

  const activeModule = useMemo(
    () => payload?.lms.modules.find((item) => item.id === moduleId || item.id.endsWith(moduleId)) || payload?.lms.modules[0],
    [payload, moduleId]
  );

  async function submitChapter(chapterId: string) {
    if (!payload || !activeModule || !sessionToken) return;
    setMessage("Submitting answer...");
    try {
      await apiRequest("/api/v1/academy/submissions/secure", {
        method: "POST",
        sessionToken,
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          application_id: payload.application.id,
          course_id: payload.lms.course.id,
          module_id: activeModule.id,
          chapter_id: chapterId,
          answer_text: answers[chapterId] || "",
          submission_kind: "text",
        }),
      });
      setMessage("Answer submitted for trainer review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit answer.");
    }
  }

  if (loading) {
    return <section className="editorial-workbench-card">Loading module workspace...</section>;
  }

  if (error) {
    return <section className="editorial-workbench-card">{error}</section>;
  }

  if (!payload || !activeModule) {
    return <section className="editorial-workbench-card">Module workspace is unavailable.</section>;
  }

  const renderChapter = (chapter: ChapterShape) => {
    const isVideoChapter = chapter.content_type === "video" || chapter.content_type === "guest_speaker";
    return (
      <section key={chapter.id} className="editorial-workbench-card">
        <div className="eyebrow">{chapter.status.replaceAll("_", " ")}</div>
        <h3 className="editorial-workbench-title" style={{ marginTop: 10, fontSize: "2rem" }}>{chapter.title}</h3>
        {isVideoChapter ? (
          <div style={{ marginTop: 16, marginBottom: 12 }}>
            <ChapterVideoEmbed
              url={chapter.video_url || ""}
              title={chapter.title}
              contentType={chapter.content_type || "video"}
            />
          </div>
        ) : null}
        <div className="editorial-workbench-subtitle" style={{ marginTop: 12 }}>
          <ChapterRichText markdown={chapter.summary} />
        </div>
        <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
          <strong>Question</strong>
          <p className="muted" style={{ marginTop: 8 }}>{chapter.question_prompt}</p>
        </div>
        <textarea
          value={answers[chapter.id] || ""}
          onChange={(event) => setAnswers((current) => ({ ...current, [chapter.id]: event.target.value }))}
          className="editorial-textarea"
          style={{ marginTop: 16 }}
          placeholder="Write your answer here"
        />
        <div className="button-row">
          <button className="button-primary" onClick={() => void submitChapter(chapter.id)}>Submit answer</button>
          <Link className="button-secondary" href="/dashboard">Back to dashboard</Link>
        </div>
      </section>
    );
  };

  // 4-level rendering: when the module has multiple lessons (or any
  // non-auto lesson), render lesson headers as section dividers.
  // When the module has only the auto-created "Main" lesson (the
  // backwards-compat path for old data), render chapters flat.
  const lessons = activeModule.lessons || [];
  const useGrouping = lessons.length > 0 && !activeModule.is_auto_grouped;

  return (
    <section className="editorial-workbench">
      <section className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Module workspace</div>
        <h2 className="editorial-workbench-title" style={{ marginTop: 12 }}>{activeModule.title}</h2>
        <p className="editorial-workbench-subtitle">{payload.lms.course.title}</p>
      </section>
      {useGrouping
        ? lessons.map((lesson) => (
            <div key={lesson.id}>
              {!lesson.auto_created ? (
                <section
                  className="editorial-workbench-panel"
                  style={{
                    marginTop: 18,
                    marginBottom: 8,
                    padding: "16px 22px",
                    background: "rgba(11, 31, 58, 0.04)",
                    borderLeft: "3px solid var(--accent, #b8860b)",
                  }}
                >
                  <div
                    className="eyebrow"
                    style={{
                      color: "var(--accent, #b8860b)",
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Lesson · {lesson.position}
                  </div>
                  <div style={{ marginTop: 8, fontSize: "1.4rem", fontWeight: 600, color: "var(--ink, #111d23)" }}>
                    {lesson.title}
                  </div>
                  {lesson.summary ? (
                    <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>{lesson.summary}</p>
                  ) : null}
                </section>
              ) : null}
              {lesson.chapters.map(renderChapter)}
            </div>
          ))
        : activeModule.chapters.map(renderChapter)}
      {message ? <section className="editorial-workbench-panel">{message}</section> : null}
    </section>
  );
}
