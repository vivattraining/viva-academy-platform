"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type StudentPayload = {
  student: { name: string; email: string; role: string };
  application: {
    id: string;
    course_name: string;
    application_stage: string;
    payment_stage: string;
    enrollment_stage: string;
    attendance_completed: number;
    attendance_total: number;
    batch_id?: string | null;
  };
  batch?: {
    id: string;
    name: string;
    course_name: string;
    start_date: string;
    trainer_name: string;
    classroom_mode: string;
  } | null;
  sessions: Array<{
    id: string;
    title: string;
    session_date: string;
    start_time: string;
    end_time: string;
    trainer_name: string;
    zoom_join_url?: string | null;
    classroom_link?: string | null;
    attendance_mode: string;
  }>;
  attendance: Array<{
    session_id: string;
    status: string;
    join_source: string;
    note: string;
  }>;
  lms?: {
    course: {
      id: string;
      title: string;
      certificate_name: string;
    };
    progress: {
      completion_percent: number;
      chapters_completed: number;
      chapters_total: number;
      current_week: number;
      penalty_ready: boolean;
      current_module?: {
        id: string;
        title: string;
        penalty_ready?: boolean;
        penalty_fee_amount?: number;
        penalty_fee_currency?: string;
        chapters?: Array<{
          id: string;
          title: string;
          status: string;
        }>;
      } | null;
    };
    modules: Array<{
      id: string;
      title: string;
      status: string;
      chapters_completed: number;
      chapters_total: number;
      penalty_ready?: boolean;
    }>;
  } | null;
};

export function StudentWorkspace() {
  const [payload, setPayload] = useState<StudentPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    async function load() {
      if (!sessionToken) {
        setError("Sign in with a student account to open the learner workspace.");
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest<StudentPayload>(`/api/v1/academy/students/me?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`, {
          sessionToken,
        });
        setPayload(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load learner data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [sessionToken]);

  if (loading) {
    return <section className="editorial-workbench-card">Loading student workspace...</section>;
  }

  if (error || !payload) {
    return <section className="editorial-workbench-card">{error || "Student workspace is unavailable."}</section>;
  }

  const progressPercent = payload.lms?.progress?.completion_percent ?? Math.round((payload.application.attendance_completed / Math.max(payload.application.attendance_total, 1)) * 100);
  const nextSession = payload.sessions[0];
  const currentModule = payload.lms?.progress?.current_module;
  const penaltyReady = Boolean(currentModule?.penalty_ready || payload.lms?.progress?.penalty_ready);
  const chapterRows =
    currentModule?.chapters?.map((chapter, index) => ({
      id: String(index + 1).padStart(2, "0"),
      title: chapter.title,
      meta: currentModule.title,
      status: chapter.status.replaceAll("_", " "),
      tone:
        chapter.status === "completed" ? "success" :
        chapter.status === "submitted" || chapter.status === "reviewed" ? "info" :
        "muted",
    })) ||
    [
      {
        id: "01",
        title: payload.application.course_name,
        meta: "Core lecture",
        status: "Evaluated - Pass",
        tone: "success",
      },
    ];

  return (
    <section className="editorial-workbench">
      {penaltyReady ? (
        <section className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Penalty active</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2.2rem" }}>
            Your submission window closed. A temporary unlock is available.
          </h2>
          <p className="editorial-workbench-subtitle">
            Pay ₹{currentModule?.penalty_fee_amount || 2000} to unlock this module for two more days and continue your assessment journey.
          </p>
          <div className="button-row">
            <button className="button-primary">Unlock access</button>
          </div>
        </section>
      ) : null}

      <section className="split">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Learner dashboard</div>
          <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
            {payload.student.name}
          </h1>
          <p className="editorial-workbench-subtitle">
            {payload.lms?.course?.title || payload.batch?.course_name || "Professional Certification in Travel & Tourism"}
          </p>
          <div className="editorial-workbench-meta">
            <span className="editorial-workbench-chip">{progressPercent}% progress</span>
            <span className="editorial-workbench-chip">
              {payload.lms ? `${payload.lms.progress.chapters_completed}/${payload.lms.progress.chapters_total} chapters` : "Attendance tracked"}
            </span>
            <span className="editorial-workbench-chip">{payload.batch?.classroom_mode || "Live cohort"}</span>
          </div>
        </article>

        <article className="editorial-workbench-card">
          <div className="eyebrow">Progress and award</div>
          <div className="metric" style={{ marginTop: 12 }}>{progressPercent}%</div>
          <div style={{ marginTop: 18, height: 12, borderRadius: 999, background: "rgba(14, 27, 44, 0.08)", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #8c6338, #0e1b2c)" }} />
          </div>
          <p className="editorial-workbench-subtitle">
            {payload.lms?.course?.certificate_name || "Certification"} unlocks once all modules are completed and evaluated as pass.
          </p>
        </article>
      </section>

      <section className="editorial-workbench-grid">
        <article className="editorial-workbench-card">
          <div className="eyebrow">Current module</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
            {currentModule?.title || `Week ${String(payload.lms?.progress?.current_week || 1).padStart(2, "0")}`}
          </h2>
          <div className="editorial-workbench-meta">
            <span className={`editorial-status ${penaltyReady ? "warning" : "info"}`}>
              {penaltyReady ? "Penalty active" : "In progress"}
            </span>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {chapterRows.map((row) => (
              <div key={row.id} className="editorial-workbench-panel">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                  <div>
                    <div className="eyebrow">{row.id}</div>
                    <strong style={{ display: "block", marginTop: 8 }}>{row.title}</strong>
                    <p className="muted" style={{ marginTop: 8 }}>{row.meta}</p>
                  </div>
                  <span className={`editorial-status ${row.tone === "success" ? "success" : row.tone === "info" ? "info" : "neutral"}`}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="button-row">
            <Link className="button-primary" href={`/dashboard/module/${currentModule?.id || payload.lms?.progress?.current_week || 1}`}>
              Open module workspace
            </Link>
          </div>
        </article>

        <div className="editorial-workbench">
          <article className="editorial-workbench-card editorial-workbench-contrast">
            <div className="eyebrow">Live interaction</div>
            <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
              {nextSession ? nextSession.title : "Advanced Ethics & Compliance Seminar"}
            </h2>
            <p className="editorial-workbench-subtitle">
              {nextSession ? `${nextSession.session_date}, ${nextSession.start_time} · ${nextSession.trainer_name}` : `Tomorrow, 10:00 AM IST · ${payload.batch?.trainer_name || "Faculty Lead"}`}
            </p>
            <div className="button-row">
              {nextSession?.zoom_join_url ? (
                <a href={nextSession.zoom_join_url} target="_blank" rel="noopener noreferrer" className="button-primary">
                  Join session
                </a>
              ) : (
                <button className="button-primary">Join session</button>
              )}
            </div>
          </article>

          <article className="editorial-workbench-card">
            <div className="eyebrow">Recent updates</div>
            <div className="stack" style={{ marginTop: 18 }}>
              <div className="editorial-workbench-panel">
                <strong>{penaltyReady ? "Missed assessment deadline" : "Module progression is live"}</strong>
                <p className="muted" style={{ marginTop: 8 }}>
                  {penaltyReady
                    ? `Penalty imposed. Pay ₹${currentModule?.penalty_fee_amount || 2000} to regain access to the next chapter.`
                    : "Trainer reviews and chapter submissions now drive your progression week by week."}
                </p>
              </div>
              <div className="editorial-workbench-panel">
                <strong>Module feedback published</strong>
                <p className="muted" style={{ marginTop: 8 }}>
                  Your recent work has been evaluated and recorded in the learner system.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
