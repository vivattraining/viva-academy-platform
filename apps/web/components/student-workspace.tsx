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

  const attendancePercent = Math.round((payload.application.attendance_completed / Math.max(payload.application.attendance_total, 1)) * 100);
  const nextSession = payload.sessions[0];
  const chapterRows = [
    {
      id: "01",
      title: payload.application.course_name,
      meta: "Core lecture",
      status: "Evaluated - Pass",
      tone: "success",
    },
    {
      id: "02",
      title: nextSession?.title || "Live session review",
      meta: nextSession ? `${nextSession.start_time} • Workshop` : "Scheduled module",
      status: payload.attendance[0]?.status === "present" ? "Submitted" : "In review",
      tone: "info",
    },
    {
      id: "03",
      title: "Final Assessment: Compliance Audit",
      meta: nextSession ? `Due after ${nextSession.session_date}` : "Pending unlock",
      status: "Not Started",
      tone: "muted",
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
                <p>{payload.batch?.course_name || "Strategic Operations & Global Compliance Track"}</p>
              </div>
              <div className="dashboard-percent">
                <span>{attendancePercent}%</span>
                <small>Overall Progress</small>
              </div>
            </div>
            <div className="dashboard-progress-rail">
              <div style={{ width: `${attendancePercent}%` }} />
            </div>
            <div className="dashboard-progress-meta">
              <span>MODULE 01 COMPLETED</span>
              <span>CERTIFICATION AT 100%</span>
            </div>
          </div>

          <div className="dashboard-panel dashboard-module-panel">
            <div className="dashboard-module-head">
              <h2>Current Module: Week 04</h2>
              <span>IN PROGRESS</span>
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
            {nextSession?.zoom_join_url ? <a href={nextSession.zoom_join_url} target="_blank" className="dashboard-live-button">Join Session</a> : <button className="dashboard-live-button">Join Session</button>}
          </div>

          <div className="dashboard-panel">
            <h3 className="dashboard-side-title">Recent Updates</h3>
            <div className="dashboard-notes">
              <div>
                <strong>Missed Assessment Deadline</strong>
                <p>Penalty imposed. Pay to regain access to the next chapter.</p>
              </div>
              <div>
                <strong>Module Feedback Published</strong>
                <p>Your recent work has been evaluated and recorded in the learner system.</p>
              </div>
            </div>
          </div>

          <div className="dashboard-certificate">
            <h3>Certification</h3>
            <p>Your professional certification will be available once all modules are completed and evaluated as pass.</p>
            <button disabled>Download Certificate</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
