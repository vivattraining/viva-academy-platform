"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

/**
 * Student home dashboard (per gap analysis §7.1).
 *
 * Tile-based home for /student. Reads /api/v1/academy/students/me as the
 * primary source of truth and fans out a couple of secondary calls
 * (reviews, tests) so we can surface latest feedback and certificate
 * readiness without round-tripping per tile. The existing /dashboard
 * (StudentWorkspace) is left untouched for backwards compatibility.
 */

type TrainerReview = {
  id: string;
  application_id?: string;
  module_id?: string;
  chapter_id?: string;
  reviewer_name?: string;
  outcome?: string;
  trainer_feedback?: string;
  ai_feedback?: string;
  reviewed_at?: string;
};

type StudentPayload = {
  student: { name: string; email: string; role: string };
  application: {
    id: string;
    course_id?: string;
    course_name: string;
    application_stage: string;
    payment_stage: string;
    enrollment_stage: string;
    attendance_completed: number;
    attendance_total: number;
    batch_id?: string | null;
    reservation_amount?: number | null;
    balance_due?: number | null;
    total_fee?: number | null;
    currency?: string | null;
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
        chapters?: Array<{ id: string; title: string; status: string }>;
      } | null;
    };
    modules: Array<{
      id: string;
      title: string;
      status: string;
      chapters_completed: number;
      chapters_total: number;
    }>;
    reviews?: TrainerReview[];
    notifications?: Array<{
      kind?: string;
      title?: string;
      body?: string;
      created_at?: string;
    }>;
  } | null;
};

type ReviewsResponse = {
  items?: TrainerReview[];
};

type TestStatus = {
  item: { id: string; pass_score: number; retake_days: number } | null;
  latest_attempt:
    | {
        id: string;
        submitted_at: string | null;
        passed: boolean | null;
        score_pct: number | null;
      }
    | null;
  can_attempt: boolean;
  can_attempt_after: string | null;
  reason: string | null;
};

function formatINRDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function parseSessionStart(date?: string, startTime?: string): Date | null {
  if (!date) return null;
  // session_date is YYYY-MM-DD; start_time is "HH:MM" or "HH:MM:SS".
  const time = (startTime || "00:00").length === 5 ? `${startTime}:00` : startTime || "00:00:00";
  // Treat as local time so the countdown matches the user's wall clock.
  const isoLocal = `${date}T${time}`;
  const parsed = new Date(isoLocal);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Starting now";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  if (days >= 1) return `Starts in ${days}d ${hours}h`;
  if (hours >= 1) return `Starts in ${hours}h ${minutes}m`;
  if (minutes >= 1) return `Starts in ${minutes}m`;
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `Starts in ${seconds}s`;
}

function attendanceTone(percent: number): "success" | "warning" | "neutral" {
  if (percent >= 90) return "success";
  if (percent >= 75) return "warning";
  return "neutral";
}

function feeTone(stage: string): "success" | "warning" | "info" | "neutral" {
  const normalised = (stage || "").toLowerCase();
  if (normalised === "paid") return "success";
  if (normalised === "reservation_paid" || normalised === "partial") return "warning";
  if (normalised === "awaiting" || normalised === "pending" || normalised === "unpaid") return "neutral";
  return "info";
}

function feeLabel(application: StudentPayload["application"]): string {
  const stage = (application.payment_stage || "").toLowerCase();
  const balance = application.balance_due ?? null;
  const currency = application.currency || "INR";
  const formatAmount = (amount: number) =>
    `${currency === "INR" ? "₹" : `${currency} `}${amount.toLocaleString("en-IN")}`;

  if (stage === "paid") return "Paid in full";
  if (stage === "reservation_paid" || stage === "partial") {
    return balance && balance > 0
      ? `Reservation paid · balance due ${formatAmount(balance)}`
      : "Reservation paid";
  }
  if (!stage || stage === "awaiting" || stage === "pending" || stage === "unpaid") {
    return "Awaiting payment";
  }
  // Unknown / custom stages — surface as-is so admin can debug.
  return stage.replaceAll("_", " ");
}

function reviewExcerpt(review: TrainerReview | null | undefined): string {
  if (!review) return "";
  const text = review.trainer_feedback || review.ai_feedback || "";
  if (text.length <= 140) return text;
  return `${text.slice(0, 137)}...`;
}

function reviewTone(outcome?: string): "success" | "warning" | "info" | "neutral" {
  switch ((outcome || "").toLowerCase()) {
    case "pass":
      return "success";
    case "resubmit":
      return "warning";
    case "fail":
      return "neutral";
    default:
      return "info";
  }
}

export function StudentHomeWorkspace() {
  const [payload, setPayload] = useState<StudentPayload | null>(null);
  const [reviews, setReviews] = useState<TrainerReview[] | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionChecked) return;
      if (!sessionToken) {
        setError("Sign in with a student account to open the home dashboard.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const me = await apiRequest<StudentPayload>(
          `/api/v1/academy/students/me?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        if (cancelled) return;
        setPayload(me);

        const applicationId = me.application?.id;
        const courseId = me.lms?.course?.id || me.application?.course_id;

        // Fan out secondary calls — degrade gracefully on failure. The
        // primary `students/me` payload already includes lms.reviews for
        // student-scoped sessions; the secondary reviews/secure fetch is
        // best-effort and will 401 when called by a student session, in
        // which case we fall back to lms.reviews below.
        const reviewsPromise = applicationId
          ? apiRequest<ReviewsResponse>(
              `/api/v1/academy/reviews/secure?tenant_name=${encodeURIComponent(
                DEFAULT_TENANT
              )}&application_id=${encodeURIComponent(applicationId)}`,
              { sessionToken }
            )
              .then((r) => r.items || [])
              .catch(() => null)
          : Promise.resolve(null);

        const testPromise =
          applicationId && courseId
            ? apiRequest<TestStatus>(
                `/api/v1/academy/tests/student?tenant_name=${encodeURIComponent(
                  DEFAULT_TENANT
                )}&course_id=${encodeURIComponent(courseId)}&application_id=${encodeURIComponent(
                  applicationId
                )}`,
                { sessionToken }
              ).catch(() => null)
            : Promise.resolve(null);

        const [secondaryReviews, secondaryTest] = await Promise.all([
          reviewsPromise,
          testPromise,
        ]);
        if (cancelled) return;

        const fallbackReviews = me.lms?.reviews || [];
        setReviews(secondaryReviews ?? fallbackReviews);
        setTestStatus(secondaryTest);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load student home dashboard."
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
  }, [sessionChecked, sessionToken]);

  // Countdown ticker. Single 30s interval drives every consumer of
  // `now` — cleared on unmount so we never leak.
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

  const nextSession = payload?.sessions?.[0];
  const nextStart = useMemo(
    () => parseSessionStart(nextSession?.session_date, nextSession?.start_time),
    [nextSession?.session_date, nextSession?.start_time]
  );
  const countdownLabel = useMemo(() => {
    if (!nextStart) return "";
    return formatCountdown(nextStart.getTime() - now);
  }, [nextStart, now]);

  if (loading) {
    return (
      <section className="editorial-workbench-card">Loading student home dashboard...</section>
    );
  }

  if (error || !payload) {
    return (
      <section className="editorial-workbench-card">
        {error || "Student home dashboard is unavailable."}
      </section>
    );
  }

  const progressPercent =
    payload.lms?.progress?.completion_percent ??
    Math.round(
      (payload.application.attendance_completed /
        Math.max(payload.application.attendance_total, 1)) *
        100
    );
  const currentModule = payload.lms?.progress?.current_module;

  // Attendance %: count attendance rows with a "present"-like status
  // against the total scheduled sessions for this batch.
  const totalSessions = payload.sessions.length;
  const presentCount = payload.attendance.filter((row) => {
    const s = (row.status || "").toLowerCase();
    return s === "present" || s === "attended" || s === "completed";
  }).length;
  const attendancePercent = totalSessions
    ? Math.round((presentCount / totalSessions) * 100)
    : 0;

  // Latest review surfaces in tile 3.
  const latestReview = (reviews && reviews.length > 0 ? reviews[0] : null);

  // Certificate readiness copy.
  let certHeadline = "Test available";
  let certSub = "Pass the certification test to unlock your certificate.";
  let certTone: "success" | "info" | "warning" | "neutral" = "info";
  if (testStatus === null) {
    certHeadline = "—";
    certSub = "Status unavailable. Try again later.";
    certTone = "neutral";
  } else if (!testStatus.item) {
    certHeadline = "Test not yet scheduled";
    certSub = "Your trainer will publish the certification test as the cohort approaches week 15.";
    certTone = "neutral";
  } else if (testStatus.latest_attempt?.passed) {
    certHeadline = "Test passed · view certificate";
    certSub = `Score: ${Math.round(testStatus.latest_attempt.score_pct ?? 0)}%. Download your certificate.`;
    certTone = "success";
  } else if (!testStatus.can_attempt && testStatus.can_attempt_after) {
    certHeadline = `Test scheduled for ${formatINRDate(testStatus.can_attempt_after)}`;
    certSub = "Retake window opens on this date.";
    certTone = "warning";
  } else if (testStatus.can_attempt) {
    certHeadline = "Test available";
    certSub = `Pass score: ${testStatus.item.pass_score}%. Take the test from the certification runner.`;
    certTone = "info";
  }

  const testHref =
    testStatus?.item && payload.lms?.course?.id
      ? `/student/test?course_id=${encodeURIComponent(
          payload.lms.course.id
        )}&application_id=${encodeURIComponent(payload.application.id)}`
      : "/student/test";

  // Notifications include the future "recording is up" source. Render
  // any present recording-published entries as a soft inline pill on
  // the live-session tile so the student notices it without us hiding
  // the rest of the dashboard.
  const recordingNotice = (payload.lms?.notifications || []).find((n) =>
    (n.kind || "").toLowerCase().includes("recording")
  );

  return (
    <section className="editorial-workbench">
      <article className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Welcome back</div>
        <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          {payload.student.name}
        </h1>
        <p className="editorial-workbench-subtitle">
          {payload.lms?.course?.title ||
            payload.batch?.course_name ||
            payload.application.course_name}
        </p>
        <div className="editorial-workbench-meta">
          <span className="editorial-workbench-chip">{progressPercent}% progress</span>
          {payload.batch?.classroom_mode ? (
            <span className="editorial-workbench-chip">{payload.batch.classroom_mode}</span>
          ) : null}
          {payload.batch?.trainer_name ? (
            <span className="editorial-workbench-chip">Trainer · {payload.batch.trainer_name}</span>
          ) : null}
        </div>
      </article>

      <section className="editorial-workbench-grid">
        {/* Tile 1 — This week's progress */}
        <article className="editorial-workbench-card">
          <div className="eyebrow">This week&apos;s progress</div>
          <div className="metric" style={{ marginTop: 12 }}>{progressPercent}%</div>
          <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>
            {currentModule?.title ||
              `Week ${String(payload.lms?.progress?.current_week || 1).padStart(2, "0")}`}
          </p>
          <div
            style={{
              marginTop: 16,
              height: 10,
              borderRadius: 999,
              background: "rgba(14, 27, 44, 0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #b8860b, #0B1F3A)",
              }}
            />
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            {payload.lms
              ? `${payload.lms.progress.chapters_completed}/${payload.lms.progress.chapters_total} chapters complete`
              : "Attendance tracked"}
          </p>
          <div className="button-row">
            <Link
              className="button-primary"
              href={`/dashboard/module/${
                currentModule?.id || payload.lms?.progress?.current_week || 1
              }`}
            >
              Open module
            </Link>
          </div>
        </article>

        {/* Tile 2 — Next live session */}
        <article className="editorial-workbench-card">
          <div className="eyebrow">Next live session</div>
          {nextSession ? (
            <>
              <h2
                className="editorial-workbench-title"
                style={{ marginTop: 12, fontSize: "1.6rem" }}
              >
                {nextSession.title}
              </h2>
              <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>
                {formatINRDate(nextSession.session_date)} · {nextSession.start_time}
              </p>
              <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                Trainer · {nextSession.trainer_name}
              </p>
              {countdownLabel ? (
                <div className="editorial-workbench-meta" style={{ marginTop: 12 }}>
                  <span className="editorial-status info">{countdownLabel}</span>
                </div>
              ) : null}
              {recordingNotice ? (
                <div className="editorial-workbench-meta" style={{ marginTop: 8 }}>
                  <span className="editorial-status success">
                    {recordingNotice.title || "Recording published"}
                  </span>
                </div>
              ) : null}
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
                  <span className="editorial-status neutral">Link pending</span>
                )}
                <Link className="button-secondary" href="/student/calendar">
                  View calendar →
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="editorial-workbench-subtitle" style={{ marginTop: 12 }}>
                No upcoming live sessions on the calendar.
              </p>
              <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                Your trainer will publish the next live class here.
              </p>
              <div className="button-row">
                <Link className="button-secondary" href="/student/calendar">
                  View calendar →
                </Link>
              </div>
            </>
          )}
        </article>

        {/* Tile 3 — Latest feedback */}
        <article className="editorial-workbench-card">
          <div className="eyebrow">Latest feedback</div>
          {latestReview ? (
            <>
              <div className="editorial-workbench-meta" style={{ marginTop: 12 }}>
                <span className={`editorial-status ${reviewTone(latestReview.outcome)}`}>
                  {(latestReview.outcome || "review").toUpperCase()}
                </span>
              </div>
              <p className="editorial-workbench-subtitle" style={{ marginTop: 12 }}>
                {latestReview.reviewer_name || "Trainer"}
              </p>
              <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                {reviewExcerpt(latestReview) || "Trainer review recorded."}
              </p>
              <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                {formatINRDate(latestReview.reviewed_at)}
              </p>
              <div className="button-row">
                <Link className="button-secondary" href="/dashboard">
                  View full
                </Link>
              </div>
            </>
          ) : reviews === null ? (
            <p className="editorial-workbench-subtitle" style={{ marginTop: 12 }}>—</p>
          ) : (
            <p className="editorial-workbench-subtitle" style={{ marginTop: 12 }}>
              No trainer feedback yet. Submit a chapter to start the review loop.
            </p>
          )}
        </article>

        {/* Tile 4 — Attendance */}
        <article className="editorial-workbench-card">
          <div className="eyebrow">Attendance</div>
          <div className="metric" style={{ marginTop: 12 }}>{attendancePercent}%</div>
          <p className="editorial-workbench-subtitle" style={{ marginTop: 8 }}>
            {presentCount} of {totalSessions} sessions
          </p>
          <div className="editorial-workbench-meta" style={{ marginTop: 12 }}>
            <span className={`editorial-status ${attendanceTone(attendancePercent)}`}>
              {attendancePercent >= 90
                ? "On track"
                : attendancePercent >= 75
                  ? "Watch closely"
                  : "Attendance low"}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            Certification requires at least 75% attendance across the cohort.
          </p>
        </article>

        {/* Tile 5 — Fee status */}
        <article className="editorial-workbench-card">
          <div className="eyebrow">Fee status</div>
          <h2
            className="editorial-workbench-title"
            style={{ marginTop: 12, fontSize: "1.4rem" }}
          >
            {feeLabel(payload.application)}
          </h2>
          <div className="editorial-workbench-meta" style={{ marginTop: 12 }}>
            <span className={`editorial-status ${feeTone(payload.application.payment_stage)}`}>
              {(payload.application.payment_stage || "pending").replaceAll("_", " ")}
            </span>
          </div>
          {payload.application.application_stage ? (
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              Application stage · {payload.application.application_stage.replaceAll("_", " ")}
            </p>
          ) : null}
          <div className="button-row">
            <Link className="button-secondary" href="/dashboard">
              View statement
            </Link>
          </div>
        </article>

        {/* Tile 6 — Certificate readiness */}
        <article className="editorial-workbench-card">
          <div className="eyebrow">Certificate readiness</div>
          <h2
            className="editorial-workbench-title"
            style={{ marginTop: 12, fontSize: "1.4rem" }}
          >
            {certHeadline}
          </h2>
          <div className="editorial-workbench-meta" style={{ marginTop: 12 }}>
            <span className={`editorial-status ${certTone}`}>
              {payload.lms?.course?.certificate_name || "Certification"}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            {certSub}
          </p>
          <div className="button-row">
            <Link className="button-primary" href={testHref}>
              {testStatus?.latest_attempt?.passed ? "View certificate" : "Open test"}
            </Link>
          </div>
        </article>
      </section>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Link
          href="/student/settings"
          style={{
            color: "var(--muted, #5b6576)",
            fontSize: 13,
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          Manage notification preferences →
        </Link>
      </div>
    </section>
  );
}
