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

  return (
    <>
      <section className="grid grid-2">
        <article className="card">
          <div className="eyebrow">Learner profile</div>
          <div style={{ marginTop: 12, fontSize: 30, fontWeight: 900, letterSpacing: "-0.05em" }}>{payload.student.name}</div>
          <p className="muted" style={{ marginTop: 10 }}>{payload.student.email}</p>
          <div className="badge-row" style={{ marginTop: 18 }}>
            <div className="badge">{payload.application.course_name}</div>
            <div className="badge">{payload.application.enrollment_stage}</div>
            <div className="badge">{payload.application.payment_stage}</div>
          </div>
        </article>
        <article className="card">
          <div className="eyebrow">Live progression</div>
          <div className="metric" style={{ marginTop: 12 }}>{attendancePercent}%</div>
          <p className="muted" style={{ marginTop: 8 }}>
            Attendance recorded: {payload.application.attendance_completed}/{payload.application.attendance_total} sessions.
          </p>
          <div style={{ marginTop: 24, height: 12, borderRadius: 999, background: "#E5E7EB", overflow: "hidden" }}>
            <div style={{ width: `${attendancePercent}%`, height: "100%", background: "#0B1F3A" }} />
          </div>
          {payload.batch ? <p className="muted" style={{ marginTop: 14 }}>Active batch: {payload.batch.name} with {payload.batch.trainer_name}</p> : null}
        </article>
      </section>

      <section className="split" style={{ marginTop: 24 }}>
        <article className="hero hero-contrast">
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Next live class</div>
          <h2 style={{ marginTop: 14, fontSize: 34, lineHeight: 1.06, letterSpacing: "-0.05em" }}>
            {nextSession ? nextSession.title : "No session scheduled yet"}
          </h2>
          <p style={{ marginTop: 14, color: "#D7E4F6", lineHeight: 1.7 }}>
            {nextSession
              ? `${nextSession.session_date} · ${nextSession.start_time} to ${nextSession.end_time} with ${nextSession.trainer_name}.`
              : "Your operations team has not published the next session yet."}
          </p>
          <div className="button-row">
            {nextSession?.zoom_join_url ? <a className="button-primary" href={nextSession.zoom_join_url} target="_blank">Join Zoom class</a> : null}
            {nextSession?.classroom_link ? <a className="button-secondary" href={nextSession.classroom_link} target="_blank">Open classroom</a> : null}
          </div>
        </article>
        <article className="card">
          <div className="section-head">
            <div className="eyebrow">What is unlocked</div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.05em" }}>The learner workspace now reflects real enrollment, schedule, and attendance state.</div>
          </div>
          <div className="badge-row">
            <div className="badge">Live roster linked</div>
            <div className="badge">Attendance auto-counted</div>
            <div className="badge">Zoom join surfaced</div>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="eyebrow">Upcoming sessions</div>
        <div className="grid grid-2" style={{ marginTop: 18 }}>
          {payload.sessions.map((session) => (
            <div key={session.id} className="panel" style={{ background: "#F2F4F6" }}>
              <div className="eyebrow">{session.attendance_mode}</div>
              <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em" }}>{session.title}</div>
              <p className="muted" style={{ marginTop: 8 }}>{session.session_date} · {session.start_time} to {session.end_time}</p>
              <p className="muted" style={{ marginTop: 8 }}>Trainer: {session.trainer_name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="eyebrow">Attendance trail</div>
        <div className="grid grid-2" style={{ marginTop: 18 }}>
          {payload.attendance.map((entry) => (
            <div key={entry.session_id} className="panel" style={{ background: "#F8FAFC" }}>
              <div className="eyebrow">{entry.status}</div>
              <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>{entry.session_id}</div>
              <p className="muted" style={{ marginTop: 8 }}>Source: {entry.join_source}</p>
              <p className="muted" style={{ marginTop: 8 }}>{entry.note}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
