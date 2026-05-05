"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

/**
 * Student calendar workspace (gap analysis §7.3).
 *
 * Lists every live session for the student's batch in chronological
 * order, grouped by month, with the next-up session pinned at the
 * top. Reads the same /api/v1/academy/students/me payload as the home
 * dashboard so we stay aligned with whatever the backend considers
 * authoritative — sessions array on the response is already sorted
 * ascending by date+time.
 */

type StudentSession = {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  trainer_name: string;
  zoom_join_url?: string | null;
  classroom_link?: string | null;
  attendance_mode: string;
};

type StudentPayload = {
  student: { name: string; email: string; role: string };
  application: {
    id: string;
    course_id?: string;
    course_name: string;
  };
  batch?: {
    id: string;
    name: string;
    course_name: string;
    start_date: string;
    trainer_name: string;
    classroom_mode: string;
  } | null;
  sessions: StudentSession[];
};

function parseSessionStart(date?: string, startTime?: string): Date | null {
  if (!date) return null;
  const time = (startTime || "00:00").length === 5 ? `${startTime}:00` : startTime || "00:00:00";
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatINRDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  } catch {
    return iso;
  }
}

function formatTimeRange(start?: string, end?: string): string {
  const s = (start || "").slice(0, 5);
  const e = (end || "").slice(0, 5);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return "—";
}

function formatMonthBucket(date: string): string {
  if (!date) return "Unscheduled";
  try {
    const d = new Date(`${date}T00:00:00`);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return date.slice(0, 7);
  }
}

function modeLabel(mode?: string): string {
  switch ((mode || "").toLowerCase()) {
    case "online":
      return "Online";
    case "in_person":
    case "in-person":
    case "offline":
    case "classroom":
      return "In-person";
    case "hybrid":
      return "Hybrid";
    default:
      return mode ? mode.replaceAll("_", " ") : "—";
  }
}

function nextUpCountdown(target: Date | null, now: number): string {
  if (!target) return "";
  const ms = target.getTime() - now;
  if (ms <= 0) return "Starting now";

  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;

  // Friendly day-relative phrasing for near-term sessions.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionMidnight = new Date(target);
  sessionMidnight.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (sessionMidnight.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
  const timePart = target.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (dayDiff === 0) {
    if (hours >= 1) return `Today at ${timePart} · starts in ${hours}h ${minutes}m`;
    if (minutes >= 1) return `Today at ${timePart} · starts in ${minutes}m`;
    return `Today at ${timePart} · starting now`;
  }
  if (dayDiff === 1) return `Tomorrow at ${timePart}`;
  if (days >= 1) return `Starts in ${days}d ${hours}h`;
  if (hours >= 1) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}

export function StudentCalendarWorkspace() {
  const [payload, setPayload] = useState<StudentPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionToken) {
        setError("Sign in with a student account to open your calendar.");
        setLoading(false);
        return;
      }
      try {
        const me = await apiRequest<StudentPayload>(
          `/api/v1/academy/students/me?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        if (cancelled) return;
        setPayload(me);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the live calendar."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  // Re-render every 30s so the countdown stays fresh.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 30_000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const upcomingSessions = useMemo(() => {
    if (!payload?.sessions) return [];
    // Backend returns sessions sorted ascending. Filter out sessions
    // whose end-of-day has already passed so the calendar focuses on
    // upcoming + in-progress; keep the trainer-published recordings
    // accessible via /dashboard.
    const cutoff = now - 12 * 60 * 60 * 1000; // grace window for in-progress
    return payload.sessions.filter((s) => {
      const start = parseSessionStart(s.session_date, s.start_time);
      return start ? start.getTime() >= cutoff : true;
    });
  }, [payload?.sessions, now]);

  const nextSession = upcomingSessions[0] || null;
  const nextStart = useMemo(
    () => parseSessionStart(nextSession?.session_date, nextSession?.start_time),
    [nextSession?.session_date, nextSession?.start_time]
  );
  const countdownLabel = useMemo(
    () => nextUpCountdown(nextStart, now),
    [nextStart, now]
  );

  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, StudentSession[]>();
    for (const s of upcomingSessions) {
      const key = formatMonthBucket(s.session_date);
      const arr = groups.get(key) || [];
      arr.push(s);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [upcomingSessions]);

  if (loading) {
    return (
      <section className="editorial-workbench-card">Loading your live calendar...</section>
    );
  }

  if (error || !payload) {
    return (
      <section className="editorial-workbench-card">
        {error || "The live calendar is unavailable."}
      </section>
    );
  }

  if (upcomingSessions.length === 0) {
    return (
      <section className="editorial-workbench">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Live calendar</div>
          <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
            {payload.batch?.course_name || payload.application.course_name}
          </h1>
          <p className="editorial-workbench-subtitle">
            No sessions scheduled yet — check back once your cohort is confirmed.
          </p>
          <div className="button-row">
            <Link className="button-secondary" href="/student">
              Back to home
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const batchMode = payload.batch?.classroom_mode || "";

  return (
    <section className="editorial-workbench">
      {/* Highlighted next-up tile */}
      {nextSession ? (
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Next up</div>
          <h1
            className="editorial-workbench-title"
            style={{ marginTop: 12, fontSize: "1.8rem" }}
          >
            {nextSession.title}
          </h1>
          <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>
            {formatINRDate(nextSession.session_date)} ·{" "}
            {formatTimeRange(nextSession.start_time, nextSession.end_time)}
          </p>
          <div className="editorial-workbench-meta" style={{ marginTop: 12 }}>
            {countdownLabel ? (
              <span className="editorial-status info">{countdownLabel}</span>
            ) : null}
            <span className="editorial-status neutral">
              Trainer · {nextSession.trainer_name}
            </span>
            <span className="editorial-status neutral">
              {modeLabel(nextSession.attendance_mode || batchMode)}
            </span>
          </div>
          <div className="button-row">
            {nextSession.zoom_join_url ? (
              <a
                href={nextSession.zoom_join_url}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary"
              >
                Join session
              </a>
            ) : (
              <span className="editorial-status neutral">Join link pending</span>
            )}
            <Link className="button-secondary" href="/student">
              Back to home
            </Link>
          </div>
        </article>
      ) : null}

      {/* Month-grouped list */}
      {groupedByMonth.map(([monthLabel, sessions]) => (
        <article key={monthLabel} className="editorial-workbench-card">
          <div className="eyebrow">{monthLabel}</div>
          <ul
            style={{
              listStyle: "none",
              margin: "16px 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {sessions.map((s) => {
              const isNext = nextSession?.id === s.id;
              return (
                <li
                  key={s.id}
                  style={{
                    borderTop: "1px solid rgba(14, 27, 44, 0.08)",
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h2
                        className="editorial-workbench-title"
                        style={{ fontSize: "1.15rem", margin: 0 }}
                      >
                        {s.title}
                      </h2>
                      <p
                        className="editorial-workbench-subtitle"
                        style={{ marginTop: 4 }}
                      >
                        {formatINRDate(s.session_date)} ·{" "}
                        {formatTimeRange(s.start_time, s.end_time)}
                      </p>
                    </div>
                    {isNext ? (
                      <span className="editorial-status info">Next up</span>
                    ) : null}
                  </div>
                  <div
                    className="editorial-workbench-meta"
                    style={{ marginTop: 4 }}
                  >
                    <span className="editorial-status neutral">
                      Trainer · {s.trainer_name}
                    </span>
                    <span className="editorial-status neutral">
                      {modeLabel(s.attendance_mode || batchMode)}
                    </span>
                  </div>
                  <div className="button-row" style={{ marginTop: 4 }}>
                    {s.zoom_join_url ? (
                      <a
                        href={s.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-primary"
                      >
                        Join session
                      </a>
                    ) : (
                      <Link className="button-secondary" href="/dashboard">
                        Details
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </section>
  );
}
