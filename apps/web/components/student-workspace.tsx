"use client";

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

  useEffect(() => {
    const session = readSession();
    if (!session?.session_token) {
      setError("Sign in with the student demo login to see the learner workspace.");
      setLoading(false);
      return;
    }
    const sessionToken = session.session_token;

    async function load() {
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
  }, []);

  if (loading) {
    return <section className="card">Loading student workspace...</section>;
  }

  if (error || !payload) {
    return <section className="card">{error || "Student workspace is unavailable."}</section>;
  }

  const progressPercent = payload.lms?.progress?.completion_percent ?? Math.round((payload.application.attendance_completed / Math.max(payload.application.attendance_total, 1)) * 100);
  const nextSession = payload.sessions[0];
  const currentModule = payload.lms?.progress?.current_module;
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
    <section className="dashboard-shell">
      <div className="dashboard-alert">
        <div>
          <strong>You missed deadline</strong>
          <p>Pay ₹2000 to unlock for 2 days and continue your assessment.</p>
        </div>
        <button>Unlock Access</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="dashboard-panel">
            <div className="dashboard-panel-top">
              <div>
                <h1>Student Dashboard</h1>
                <p>{payload.lms?.course?.title || payload.batch?.course_name || "Professional Certification in Travel & Tourism"}</p>
              </div>
              <div className="dashboard-percent">
                <span>{progressPercent}%</span>
                <small>Overall Progress</small>
              </div>
            </div>
            <div className="dashboard-progress-rail">
              <div style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="dashboard-progress-meta">
              <span>{payload.lms ? `${payload.lms.progress.chapters_completed}/${payload.lms.progress.chapters_total} chapters completed` : "MODULE 01 COMPLETED"}</span>
              <span>{payload.lms?.course?.certificate_name || "CERTIFICATION AT 100%"}</span>
            </div>
          </div>

          <div className="dashboard-panel dashboard-module-panel">
            <div className="dashboard-module-head">
              <h2>Current Module: {currentModule?.title || `Week ${String(payload.lms?.progress?.current_week || 1).padStart(2, "0")}`}</h2>
              <span>{currentModule?.penalty_ready || payload.lms?.progress?.penalty_ready ? "PENALTY ACTIVE" : "IN PROGRESS"}</span>
            </div>
            <div className="dashboard-module-list">
              {chapterRows.map((row) => (
                <div key={row.id} className={`dashboard-module-row ${row.tone}`}>
                  <div className="dashboard-module-left">
                    <span className="dashboard-index">{row.id}</span>
                    <div>
                      <h3>{row.title}</h3>
                      <p>{row.meta}</p>
                    </div>
                  </div>
                  <div className="dashboard-module-right">
                    <span className={`dashboard-status ${row.tone}`}>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="dashboard-side">
          <div className="dashboard-live-card">
            <p className="kicker">Live Interaction</p>
            <h2>{nextSession ? nextSession.title : "Advanced Ethics & Compliance Seminar"}</h2>
            <div className="dashboard-live-meta">
              <p>{nextSession ? `${nextSession.session_date}, ${nextSession.start_time}` : "Tomorrow, 10:00 AM IST"}</p>
              <p>{nextSession?.trainer_name || payload.batch?.trainer_name || "Faculty Lead"}</p>
            </div>
            {nextSession?.zoom_join_url ? <a href={nextSession.zoom_join_url} target="_blank" rel="noopener noreferrer" className="dashboard-live-button">Join Session</a> : <button className="dashboard-live-button">Join Session</button>}
          </div>

          <div className="dashboard-panel">
            <h3 className="dashboard-side-title">Recent Updates</h3>
            <div className="dashboard-notes">
              <div>
                <strong>{payload.lms?.progress?.penalty_ready ? "Missed Assessment Deadline" : "Module progression is live"}</strong>
                <p>
                  {payload.lms?.progress?.penalty_ready
                    ? `Penalty imposed. Pay ₹${currentModule?.penalty_fee_amount || 2000} to regain access to the next chapter.`
                    : "Trainer reviews and chapter submissions now drive your progression week by week."}
                </p>
              </div>
              <div>
                <strong>Module Feedback Published</strong>
                <p>Your recent work has been evaluated and recorded in the learner system.</p>
              </div>
            </div>
          </div>

          <div className="dashboard-certificate">
            <h3>Certification</h3>
            <p>Your {payload.lms?.course?.certificate_name || "professional certification"} will be available once all modules are completed and evaluated as pass.</p>
            <button disabled>Download Certificate</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
