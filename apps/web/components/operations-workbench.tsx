"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";
import { humanize } from "../lib/humanize";

const humanizedStatus = humanize;

type Application = { id: string; student_name: string; student_email: string; batch_id: string | null; enrollment_stage: string };
type Batch = { id: string; name: string; course_name: string; trainer_name: string; classroom_mode: string };
type Session = { id: string; title: string; session_date: string; start_time: string; end_time: string; trainer_name: string; attendance_mode: string; zoom_join_url: string | null; zoom_start_url: string | null; zoom_meeting_id: string | null };
type Attendance = { application_id: string; status: string; marked_by: string };

export function OperationsWorkbench() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  async function loadBase() {
    if (!sessionToken) return;
    try {
      const [batchData, appData] = await Promise.all([
        apiRequest<{ items: Batch[] }>(`/api/v1/academy/batches/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`, { sessionToken }),
        apiRequest<{ items: Application[] }>(`/api/v1/academy/applications/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`, { sessionToken }),
      ]);
      setBatches(batchData.items || []);
      setApplications(appData.items || []);
      setSelectedBatchId((current) => current || batchData.items?.[0]?.id || "");
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load operations data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function hydrate() {
      if (!sessionToken) {
        setError("Operations session required.");
        setLoading(false);
        return;
      }
      await loadBase();
    }
    void hydrate();
    // We only need to react to session changes here; the loader itself is intentionally local to this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  useEffect(() => {
    async function loadSessions() {
      if (!selectedBatchId || !sessionToken) return;
      try {
        const data = await apiRequest<{ items: Session[] }>(
          `/api/v1/academy/sessions/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}&batch_id=${encodeURIComponent(selectedBatchId)}`,
          { sessionToken }
        );
        setSessions(data.items || []);
        setSelectedSessionId((current) => current || data.items?.[0]?.id || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load batch sessions.");
      }
    }
    void loadSessions();
  }, [selectedBatchId, sessionToken]);

  useEffect(() => {
    async function loadAttendance() {
      if (!selectedSessionId || !sessionToken) return;
      try {
        const data = await apiRequest<{ items: Attendance[] }>(
          `/api/v1/academy/sessions/${selectedSessionId}/attendance/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        setAttendance(data.items || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load attendance.");
      }
    }
    void loadAttendance();
  }, [selectedSessionId, sessionToken]);

  const selectedSession = useMemo(() => sessions.find((item) => item.id === selectedSessionId) || null, [sessions, selectedSessionId]);
  const batchStudents = useMemo(() => applications.filter((item) => item.batch_id === selectedBatchId && (item.enrollment_stage === "active" || item.enrollment_stage === "completed")), [applications, selectedBatchId]);

  async function provisionZoom() {
    if (!selectedSessionId || !sessionToken) return;
    setMessage("Provisioning Zoom meeting...");
    await apiRequest(`/api/v1/academy/sessions/${selectedSessionId}/zoom/provision/secure`, {
      method: "POST",
      sessionToken,
      body: JSON.stringify({ tenant_name: DEFAULT_TENANT, session_id: selectedSessionId })
    });
    await loadBase();
    setMessage("Zoom meeting is ready.");
  }

  async function markAttendance(applicationId: string, status: string) {
    if (!selectedSessionId || !sessionToken) return;
    await apiRequest(`/api/v1/academy/sessions/${selectedSessionId}/attendance/secure`, {
      method: "POST",
      sessionToken,
      body: JSON.stringify({
        tenant_name: DEFAULT_TENANT,
        application_id: applicationId,
        status
      })
    });
    const data = await apiRequest<{ items: Attendance[] }>(
      `/api/v1/academy/sessions/${selectedSessionId}/attendance/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
      { sessionToken }
    );
    setAttendance(data.items || []);
  }

  if (loading) {
    return <section className="editorial-workbench-card">Loading classroom operations...</section>;
  }

  if (error) {
    return <section className="editorial-workbench-card">{error}</section>;
  }

  return (
    <div className="editorial-workbench">
      <section className="ops-top-row">
        <article className="editorial-workbench-card">
          <div className="eyebrow">Batch</div>
          <select value={selectedBatchId} onChange={(event) => { setSelectedBatchId(event.target.value); setSelectedSessionId(""); }} className="editorial-select" style={{ marginTop: 12 }}>
            {batches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {!batches.length ? <p className="muted" style={{ marginTop: 12 }}>No active batches are available yet.</p> : null}
        </article>
        <article className="editorial-workbench-card">
          <div className="eyebrow">Session</div>
          <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} className="editorial-select" style={{ marginTop: 12 }}>
            {sessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          {selectedSession ? (
            <div className="button-row" style={{ marginTop: 12 }}>
              <button className="button-primary" onClick={() => void provisionZoom()}>Provision Zoom</button>
              {selectedSession.zoom_join_url ? <a className="button-secondary" href={selectedSession.zoom_join_url} target="_blank" rel="noopener noreferrer">Student join</a> : null}
              {selectedSession.zoom_start_url ? <a className="button-secondary" href={selectedSession.zoom_start_url} target="_blank" rel="noopener noreferrer">Trainer start</a> : null}
            </div>
          ) : null}
          {message ? <div className="editorial-workbench-panel" style={{ marginTop: 12 }}>{message}</div> : null}
        </article>
      </section>

      <section className="editorial-workbench-grid">
        {!batchStudents.length ? (
          <article className="editorial-workbench-card">
            <div className="eyebrow">Attendance board</div>
            <p className="muted" style={{ marginTop: 12 }}>Select a batch with enrolled learners to start attendance marking.</p>
          </article>
        ) : null}
        {batchStudents.map((student) => {
          const record = attendance.find((item) => item.application_id === student.id);
          return (
            <article key={student.id} className="editorial-workbench-card">
              <div className="eyebrow">{student.student_name}</div>
              <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>{student.student_email}</p>
              <div style={{ marginTop: 12 }}>
                <span className={`editorial-status ${record?.status === "present" ? "success" : record?.status === "late" ? "warning" : record?.status === "absent" ? "neutral" : "info"}`}>
                  {record ? `${humanizedStatus(record.status)} · ${record.marked_by}` : "Not marked yet"}
                </span>
              </div>
              <div className="button-row">
                <button
                  className={record?.status === "present" ? "button-active" : "button-toggle"}
                  aria-pressed={record?.status === "present"}
                  onClick={() => void markAttendance(student.id, "present")}
                >
                  Present
                </button>
                <button
                  className={record?.status === "late" ? "button-active" : "button-toggle"}
                  aria-pressed={record?.status === "late"}
                  onClick={() => void markAttendance(student.id, "late")}
                >
                  Late
                </button>
                <button
                  className={record?.status === "absent" ? "button-active" : "button-toggle"}
                  aria-pressed={record?.status === "absent"}
                  onClick={() => void markAttendance(student.id, "absent")}
                >
                  Absent
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
