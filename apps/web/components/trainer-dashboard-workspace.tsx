"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type Session = {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  trainer_name: string;
  attendance_mode?: string;
  zoom_join_url?: string | null;
  zoom_start_url?: string | null;
  batch_id?: string | null;
};

type Batch = {
  id: string;
  name: string;
  course_name?: string;
  trainer_name?: string;
  classroom_mode?: string;
};

type QueueItem = {
  submission_id: string;
  submitted_at?: string;
  status: string;
  student_name?: string;
  student_email?: string;
  course_name?: string;
  module_title?: string;
  chapter_title?: string;
  application_id?: string;
  module_id?: string;
  chapter_id?: string;
};

type SessionResource = {
  id: string;
  session_id: string;
  kind: string;
  url?: string | null;
  title?: string | null;
};

type TabId = "week" | "inbox" | "recordings";

const TABS: Array<{ id: TabId; label: string; eyebrow: string }> = [
  { id: "week", label: "My week", eyebrow: "Live sessions" },
  { id: "inbox", label: "Submissions inbox", eyebrow: "Awaiting review" },
  { id: "recordings", label: "Recordings to upload", eyebrow: "Last 7 days" },
];

// ---------- date helpers (no extra deps) ----------

function parseSessionEnd(session: Session): Date | null {
  if (!session.session_date) return null;
  const time = session.end_time || session.start_time || "00:00";
  // Accept "HH:MM" or "HH:MM:SS"
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const iso = `${session.session_date}T${normalizedTime}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseSessionStart(session: Session): Date | null {
  if (!session.session_date) return null;
  const time = session.start_time || "00:00";
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const iso = `${session.session_date}T${normalizedTime}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysAgo(date: Date, ref: Date) {
  const ms = ref.getTime() - date.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function hoursAgo(date: Date, ref: Date) {
  const ms = ref.getTime() - date.getTime();
  return ms / (1000 * 60 * 60);
}

function formatSessionWhen(session: Session) {
  const start = parseSessionStart(session);
  if (!start) return `${session.session_date} ${session.start_time}`;
  const date = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${date}, ${session.start_time}${session.end_time ? `–${session.end_time}` : ""}`;
}

function formatSubmittedAt(value?: string) {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- component ----------

export function TrainerDashboardWorkspace() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string>("");

  const [activeTab, setActiveTab] = useState<TabId>("week");

  // Tab 1 + Tab 3 share the sessions list.
  const [sessions, setSessions] = useState<Session[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  // Tab 2 — review queue.
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  // Tab 3 — recording resources keyed by session_id.
  const [recordingMap, setRecordingMap] = useState<Record<string, SessionResource[]>>({});
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState("");

  // Add-recording modal state.
  const [recordingTarget, setRecordingTarget] = useState<Session | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingSubmitting, setRecordingSubmitting] = useState(false);
  const [recordingError, setRecordingError] = useState("");

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  // Load trainer identity + batches + sessions.
  useEffect(() => {
    async function hydrate() {
      if (!sessionToken) {
        setSessionsError("Trainer session required to open the dashboard.");
        setQueueError("Trainer session required to open the dashboard.");
        setRecordingsError("Trainer session required to open the dashboard.");
        setSessionsLoading(false);
        setQueueLoading(false);
        setRecordingsLoading(false);
        return;
      }
      try {
        const me = await apiRequest<{ session: { full_name: string } }>(
          `/api/v1/academy/auth/me?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
          { sessionToken }
        );
        setTrainerName(me.session.full_name || "");
      } catch {
        // Non-fatal — we'll still try to render with an empty trainer name
        // (which will yield no matches and an empty state).
      }

      // Fire sessions, batches, and review queue in parallel.
      void loadSessions(sessionToken);
      void loadBatches(sessionToken);
      void loadQueue(sessionToken);
    }
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  async function loadSessions(token: string) {
    setSessionsLoading(true);
    try {
      const data = await apiRequest<{ items: Session[] }>(
        `/api/v1/academy/sessions/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken: token }
      );
      setSessions(data.items || []);
      setSessionsError("");
    } catch (loadError) {
      setSessionsError(
        loadError instanceof Error ? loadError.message : "Unable to load sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  }

  async function loadBatches(token: string) {
    try {
      const data = await apiRequest<{ items: Batch[] }>(
        `/api/v1/academy/batches/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken: token }
      );
      setBatches(data.items || []);
    } catch {
      // Batch lookup is auxiliary — if it fails we just show "—" for
      // batch names rather than blocking the whole tab.
    }
  }

  async function loadQueue(token: string) {
    setQueueLoading(true);
    try {
      const data = await apiRequest<{ queue?: QueueItem[]; items?: QueueItem[] }>(
        `/api/v1/academy/reviews/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken: token }
      );
      setQueue(data.queue || []);
      setQueueError("");
    } catch (loadError) {
      setQueueError(
        loadError instanceof Error ? loadError.message : "Unable to load review queue."
      );
    } finally {
      setQueueLoading(false);
    }
  }

  // ---------- derived: my sessions ----------

  const mySessions = useMemo(() => {
    if (!trainerName) return [] as Session[];
    return sessions.filter(
      (item) =>
        (item.trainer_name || "").trim().toLowerCase() ===
        trainerName.trim().toLowerCase()
    );
  }, [sessions, trainerName]);

  const batchById = useMemo(() => {
    const map = new Map<string, Batch>();
    for (const batch of batches) map.set(batch.id, batch);
    return map;
  }, [batches]);

  // Load recordings for sessions in the last 7 days that have already ended.
  // We re-run when mySessions changes.
  useEffect(() => {
    async function loadRecordings() {
      if (!sessionToken) return;
      const now = new Date();
      const candidates = mySessions.filter((session) => {
        const end = parseSessionEnd(session);
        if (!end) return false;
        const days = daysAgo(end, now);
        return days >= 0 && days <= 7;
      });
      if (!candidates.length) {
        setRecordingMap({});
        setRecordingsLoading(false);
        setRecordingsError("");
        return;
      }
      setRecordingsLoading(true);
      try {
        const results = await Promise.all(
          candidates.map(async (session) => {
            try {
              const data = await apiRequest<{ items: SessionResource[] }>(
                `/api/v1/academy/sessions/${session.id}/resources/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
                { sessionToken }
              );
              return [session.id, data.items || []] as const;
            } catch {
              // A single session resource fetch failing shouldn't break
              // the whole tab — treat it as "no recording known yet" so
              // the trainer still sees the row and can upload.
              return [session.id, [] as SessionResource[]] as const;
            }
          })
        );
        const next: Record<string, SessionResource[]> = {};
        for (const [id, items] of results) next[id] = items;
        setRecordingMap(next);
        setRecordingsError("");
      } catch (loadError) {
        setRecordingsError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load session resources."
        );
      } finally {
        setRecordingsLoading(false);
      }
    }
    void loadRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySessions, sessionToken]);

  // ---------- group: today / this week / past 7 days ----------

  type Grouped = {
    today: Session[];
    thisWeek: Session[];
    past7: Session[];
  };

  const grouped: Grouped = useMemo(() => {
    const today: Session[] = [];
    const thisWeek: Session[] = [];
    const past7: Session[] = [];
    const now = new Date();
    for (const session of mySessions) {
      const start = parseSessionStart(session);
      const end = parseSessionEnd(session);
      if (!start) continue;
      if (isSameDay(start, now)) {
        today.push(session);
        continue;
      }
      if (start.getTime() > now.getTime()) {
        // Future. Within the next 7 days counts as "this week".
        const days = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (days <= 7) thisWeek.push(session);
        continue;
      }
      // Past — within last 7 days using end (or start) timestamp.
      const ref = end || start;
      const days = daysAgo(ref, now);
      if (days >= 0 && days <= 7) past7.push(session);
    }
    const byTime = (a: Session, b: Session) => {
      const ta = parseSessionStart(a)?.getTime() || 0;
      const tb = parseSessionStart(b)?.getTime() || 0;
      return ta - tb;
    };
    today.sort(byTime);
    thisWeek.sort(byTime);
    past7.sort((a, b) => {
      // Most recent past first.
      const ta = parseSessionStart(a)?.getTime() || 0;
      const tb = parseSessionStart(b)?.getTime() || 0;
      return tb - ta;
    });
    return { today, thisWeek, past7 };
  }, [mySessions]);

  // ---------- tab 3: rows ----------

  const recordingRows = useMemo(() => {
    const now = new Date();
    return mySessions
      .map((session) => {
        const end = parseSessionEnd(session);
        if (!end) return null;
        const hoursSince = hoursAgo(end, now);
        if (hoursSince <= 0) return null; // hasn't ended yet
        const days = daysAgo(end, now);
        if (days > 7) return null; // older than 7 days — out of scope
        const resources = recordingMap[session.id] || [];
        const hasRecording = resources.some((r) => r.kind === "recording");
        if (hasRecording) return null;
        let urgency: "calm" | "yellow" | "red" = "calm";
        if (hoursSince > 48) urgency = "red";
        else if (hoursSince > 24) urgency = "yellow";
        return { session, hoursSince, urgency };
      })
      .filter((row): row is { session: Session; hoursSince: number; urgency: "calm" | "yellow" | "red" } => row !== null)
      .sort((a, b) => b.hoursSince - a.hoursSince);
  }, [mySessions, recordingMap]);

  // ---------- review deep-link ----------

  function reviewHref(_item: QueueItem) {
    // The existing /trainer page renders TrainerReviewWorkspace, which
    // currently does not support a per-submission deep link. We send the
    // trainer to the inbox tab for now — the trainer-review-workspace
    // page will need a query-param hook in a follow-up to land on a
    // specific submission. Hash anchoring still scrolls into view if
    // the workspace renders the submission_id as the panel id.
    return `/trainer#inbox`;
  }

  // ---------- add recording modal ----------

  function openRecordingModal(session: Session) {
    setRecordingTarget(session);
    setRecordingUrl("");
    setRecordingTitle("");
    setRecordingError("");
  }

  function closeRecordingModal() {
    setRecordingTarget(null);
    setRecordingUrl("");
    setRecordingTitle("");
    setRecordingError("");
    setRecordingSubmitting(false);
  }

  async function submitRecording() {
    if (!recordingTarget || !sessionToken) return;
    if (!recordingUrl.trim()) {
      setRecordingError("Paste the recording URL before saving.");
      return;
    }
    setRecordingSubmitting(true);
    setRecordingError("");
    try {
      const created = await apiRequest<SessionResource>(
        `/api/v1/academy/sessions/${recordingTarget.id}/resources/secure`,
        {
          method: "POST",
          sessionToken,
          body: JSON.stringify({
            tenant_name: DEFAULT_TENANT,
            session_id: recordingTarget.id,
            kind: "recording",
            url: recordingUrl.trim(),
            title: recordingTitle.trim() || undefined,
          }),
        }
      );
      // Optimistically merge into the recording map so the row drops out.
      setRecordingMap((prev) => {
        const existing = prev[recordingTarget.id] || [];
        const stub: SessionResource = created && (created as SessionResource).id
          ? (created as SessionResource)
          : {
              id: `local-${Date.now()}`,
              session_id: recordingTarget.id,
              kind: "recording",
              url: recordingUrl.trim(),
              title: recordingTitle.trim() || null,
            };
        return { ...prev, [recordingTarget.id]: [...existing, stub] };
      });
      closeRecordingModal();
    } catch (saveError) {
      setRecordingError(
        saveError instanceof Error ? saveError.message : "Unable to save the recording link."
      );
      setRecordingSubmitting(false);
    }
  }

  // ---------- render ----------

  return (
    <section className="editorial-workbench">
      <article className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Trainer dashboard</div>
        <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          {trainerName ? `${trainerName}'s teaching desk` : "Teaching desk"}
        </h1>
        <p className="editorial-workbench-subtitle">
          One surface for the week ahead, the submissions queue, and the recordings still owed
          to learners.
        </p>
        <div
          className="button-row"
          role="tablist"
          aria-label="Trainer dashboard tabs"
          style={{ marginTop: 18, flexWrap: "wrap" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "button-active" : "button-toggle"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </article>

      {activeTab === "week" ? (
        <MyWeekTab
          loading={sessionsLoading}
          error={sessionsError}
          grouped={grouped}
          batchById={batchById}
        />
      ) : null}

      {activeTab === "inbox" ? (
        <SubmissionsInboxTab
          loading={queueLoading}
          error={queueError}
          queue={queue}
          reviewHref={reviewHref}
        />
      ) : null}

      {activeTab === "recordings" ? (
        <RecordingsTab
          loading={sessionsLoading || recordingsLoading}
          error={sessionsError || recordingsError}
          rows={recordingRows}
          onAdd={openRecordingModal}
        />
      ) : null}

      {recordingTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add recording"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14, 27, 44, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 1000,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeRecordingModal();
          }}
        >
          <div
            className="editorial-workbench-card"
            style={{ width: "100%", maxWidth: 520, background: "white" }}
          >
            <div className="eyebrow">Add recording</div>
            <h2
              className="editorial-workbench-title"
              style={{ marginTop: 12, fontSize: "1.5rem" }}
            >
              {recordingTarget.title}
            </h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {formatSessionWhen(recordingTarget)}
            </p>
            <div className="stack" style={{ marginTop: 18 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="eyebrow">Recording URL</span>
                <input
                  type="url"
                  className="editorial-input"
                  placeholder="https://..."
                  value={recordingUrl}
                  onChange={(event) => setRecordingUrl(event.target.value)}
                  style={{
                    border: "1px solid rgba(14, 27, 44, 0.18)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 14,
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="eyebrow">Title (optional)</span>
                <input
                  type="text"
                  placeholder="e.g. Week 3 — Ethics & Compliance"
                  value={recordingTitle}
                  onChange={(event) => setRecordingTitle(event.target.value)}
                  style={{
                    border: "1px solid rgba(14, 27, 44, 0.18)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 14,
                  }}
                />
              </label>
            </div>
            {recordingError ? (
              <p
                className="editorial-status warning"
                style={{ marginTop: 14, display: "inline-block" }}
              >
                {recordingError}
              </p>
            ) : null}
            <div className="button-row">
              <button
                className="button-primary"
                onClick={() => void submitRecording()}
                disabled={recordingSubmitting}
              >
                {recordingSubmitting ? "Saving..." : "Save recording"}
              </button>
              <button
                className="button-secondary"
                onClick={closeRecordingModal}
                disabled={recordingSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ---------- tab views ----------

function MyWeekTab({
  loading,
  error,
  grouped,
  batchById,
}: {
  loading: boolean;
  error: string;
  grouped: { today: Session[]; thisWeek: Session[]; past7: Session[] };
  batchById: Map<string, Batch>;
}) {
  if (loading) {
    return <article className="editorial-workbench-card">Loading your week...</article>;
  }
  if (error) {
    return <article className="editorial-workbench-card">{error}</article>;
  }
  const totalSessions =
    grouped.today.length + grouped.thisWeek.length + grouped.past7.length;
  if (!totalSessions) {
    return (
      <article className="editorial-workbench-card">
        <div className="eyebrow">My week</div>
        <h2
          className="editorial-workbench-title"
          style={{ marginTop: 12, fontSize: "1.75rem" }}
        >
          No sessions this week.
        </h2>
        <p className="muted" style={{ marginTop: 10 }}>
          Your calendar is clear. As soon as operations schedules a live session for one of
          your batches, it will appear here.
        </p>
      </article>
    );
  }

  return (
    <section className="editorial-workbench-grid">
      <SessionGroup
        eyebrow="Today"
        sessions={grouped.today}
        batchById={batchById}
        emptyNote="Nothing scheduled for today."
      />
      <SessionGroup
        eyebrow="This week"
        sessions={grouped.thisWeek}
        batchById={batchById}
        emptyNote="Nothing else scheduled this week."
      />
      <SessionGroup
        eyebrow="Past 7 days"
        sessions={grouped.past7}
        batchById={batchById}
        emptyNote="No sessions in the last 7 days."
      />
    </section>
  );
}

function SessionGroup({
  eyebrow,
  sessions,
  batchById,
  emptyNote,
}: {
  eyebrow: string;
  sessions: Session[];
  batchById: Map<string, Batch>;
  emptyNote: string;
}) {
  return (
    <article className="editorial-workbench-card">
      <div className="eyebrow">{eyebrow}</div>
      <div className="stack" style={{ marginTop: 16 }}>
        {sessions.length ? (
          sessions.map((session) => {
            const batch = session.batch_id ? batchById.get(session.batch_id) : null;
            return (
              <div key={session.id} className="editorial-workbench-panel">
                <strong style={{ display: "block" }}>{session.title}</strong>
                <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  {formatSessionWhen(session)}
                  {batch ? ` · ${batch.name}` : ""}
                </p>
                <div className="button-row" style={{ marginTop: 14 }}>
                  {session.zoom_join_url ? (
                    <a
                      className="button-primary"
                      href={session.zoom_join_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Zoom
                    </a>
                  ) : (
                    <span className="editorial-status neutral">No Zoom link yet</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="muted">{emptyNote}</p>
        )}
      </div>
    </article>
  );
}

function SubmissionsInboxTab({
  loading,
  error,
  queue,
  reviewHref,
}: {
  loading: boolean;
  error: string;
  queue: QueueItem[];
  reviewHref: (item: QueueItem) => string;
}) {
  if (loading) {
    return <article className="editorial-workbench-card">Loading review queue...</article>;
  }
  if (error) {
    return <article className="editorial-workbench-card">{error}</article>;
  }
  if (!queue.length) {
    return (
      <article className="editorial-workbench-card">
        <div className="eyebrow">Submissions inbox</div>
        <h2
          className="editorial-workbench-title"
          style={{ marginTop: 12, fontSize: "1.75rem" }}
        >
          Inbox zero — nothing to review.
        </h2>
        <p className="muted" style={{ marginTop: 10 }}>
          Every submission has been triaged. New submissions will appear here as soon as
          learners send them in.
        </p>
      </article>
    );
  }

  return (
    <article className="editorial-workbench-card">
      <div className="eyebrow">Submissions inbox</div>
      <div className="stack" style={{ marginTop: 16 }}>
        {queue.map((item) => (
          <div key={item.submission_id} className="editorial-workbench-panel">
            <strong>{item.student_name || "Learner"}</strong>
            <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              {[item.course_name, item.module_title, item.chapter_title]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
              Submitted {formatSubmittedAt(item.submitted_at)}
            </p>
            <div className="button-row" style={{ marginTop: 14 }}>
              <Link className="button-primary" href={reviewHref(item)}>
                Review
              </Link>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function RecordingsTab({
  loading,
  error,
  rows,
  onAdd,
}: {
  loading: boolean;
  error: string;
  rows: Array<{ session: Session; hoursSince: number; urgency: "calm" | "yellow" | "red" }>;
  onAdd: (session: Session) => void;
}) {
  if (loading) {
    return <article className="editorial-workbench-card">Loading recordings...</article>;
  }
  if (error) {
    return <article className="editorial-workbench-card">{error}</article>;
  }
  if (!rows.length) {
    return (
      <article className="editorial-workbench-card">
        <div className="eyebrow">Recordings to upload</div>
        <h2
          className="editorial-workbench-title"
          style={{ marginTop: 12, fontSize: "1.75rem" }}
        >
          All recordings uploaded.
        </h2>
        <p className="muted" style={{ marginTop: 10 }}>
          Every session in the last 7 days has a recording link attached. Learners who
          missed live can rewatch on their own time.
        </p>
      </article>
    );
  }

  return (
    <article className="editorial-workbench-card">
      <div className="eyebrow">Recordings to upload</div>
      <div className="stack" style={{ marginTop: 16 }}>
        {rows.map(({ session, hoursSince, urgency }) => {
          const tone =
            urgency === "red" ? "warning" : urgency === "yellow" ? "info" : "neutral";
          const label =
            urgency === "red"
              ? `Overdue · ${Math.round(hoursSince)}h since end`
              : urgency === "yellow"
                ? `${Math.round(hoursSince)}h since end`
                : `${Math.round(hoursSince)}h since end`;
          return (
            <div key={session.id} className="editorial-workbench-panel">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block" }}>{session.title}</strong>
                  <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                    {formatSessionWhen(session)}
                  </p>
                </div>
                <span className={`editorial-status ${tone}`}>{label}</span>
              </div>
              <div className="button-row" style={{ marginTop: 14 }}>
                <button className="button-primary" onClick={() => onAdd(session)}>
                  Add recording
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
