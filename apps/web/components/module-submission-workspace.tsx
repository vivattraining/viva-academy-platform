"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type StudentLmsPayload = {
  application: { id: string };
  lms: {
    course: { id: string; title: string };
    modules: Array<{
      id: string;
      title: string;
      status: string;
      chapters: Array<{
        id: string;
        title: string;
        summary: string;
        question_prompt: string;
        status: string;
        submission?: { answer_text?: string | null } | null;
      }>;
    }>;
  };
};

export function ModuleSubmissionWorkspace({ moduleId }: { moduleId: string }) {
  const [payload, setPayload] = useState<StudentLmsPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const session = readSession();
      if (!session) return;
      const data = await apiRequest<StudentLmsPayload>(
        `/api/v1/academy/students/me/lms?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { session }
      );
      setPayload(data);
      const nextAnswers: Record<string, string> = {};
      for (const moduleItem of data.lms.modules) {
        for (const chapter of moduleItem.chapters) {
          nextAnswers[chapter.id] = chapter.submission?.answer_text || "";
        }
      }
      setAnswers(nextAnswers);
    }
    void load();
  }, []);

  const activeModule = useMemo(
    () => payload?.lms.modules.find((item) => item.id === moduleId || item.id.endsWith(moduleId)) || payload?.lms.modules[0],
    [payload, moduleId]
  );

  async function submitChapter(chapterId: string) {
    if (!payload || !activeModule) return;
    setMessage("Submitting answer...");
    try {
      await apiRequest("/api/v1/academy/submissions/secure", {
        method: "POST",
        session: readSession(),
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

  if (!payload || !activeModule) {
    return <section className="card">Loading module workspace...</section>;
  }

  return (
    <section className="stack">
      <section className="card">
        <div className="eyebrow">Module workspace</div>
        <h2 style={{ marginTop: 12, fontSize: 32, fontWeight: 900, letterSpacing: "-0.05em" }}>{activeModule.title}</h2>
        <p className="muted" style={{ marginTop: 12 }}>{payload.lms.course.title}</p>
      </section>
      {activeModule.chapters.map((chapter) => (
        <section key={chapter.id} className="card">
          <div className="eyebrow">{chapter.status.replaceAll("_", " ")}</div>
          <h3 style={{ marginTop: 10, fontSize: 24 }}>{chapter.title}</h3>
          <p className="muted" style={{ marginTop: 10 }}>{chapter.summary}</p>
          <div className="panel" style={{ marginTop: 16 }}>
            <strong>Question</strong>
            <p className="muted" style={{ marginTop: 8 }}>{chapter.question_prompt}</p>
          </div>
          <textarea
            value={answers[chapter.id] || ""}
            onChange={(event) => setAnswers((current) => ({ ...current, [chapter.id]: event.target.value }))}
            style={{ width: "100%", minHeight: 160, marginTop: 16, borderRadius: 20, padding: 16, border: "1px solid var(--border)", font: "inherit" }}
            placeholder="Write your answer here"
          />
          <div className="button-row">
            <button className="button-primary" onClick={() => void submitChapter(chapter.id)}>Submit answer</button>
            <Link className="button-secondary" href="/dashboard">Back to dashboard</Link>
          </div>
        </section>
      ))}
      {message ? <section className="panel">{message}</section> : null}
    </section>
  );
}
