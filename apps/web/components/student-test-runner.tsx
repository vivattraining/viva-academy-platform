"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

type Question = {
  id: string;
  test_id: string;
  prompt: string;
  type: "true_false" | "multiple_choice";
  options: string[];
  points: number;
  position: number;
};

type Test = {
  id: string;
  course_id: string;
  pass_score: number;
  retake_days: number;
};

type Attempt = {
  id: string;
  test_id: string;
  application_id: string;
  started_at: string;
  submitted_at: string | null;
  score_pct: number | null;
  passed: boolean | null;
  earned_points?: number;
  total_points?: number;
};

type LoadResponse = {
  item: Test | null;
  questions: Question[];
  latest_attempt: Attempt | null;
  can_attempt: boolean;
  can_attempt_after: string | null;
  reason: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
}

export function StudentTestRunner({ courseId, applicationId }: { courseId: string; applicationId: string }) {
  const [data, setData] = useState<LoadResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [submittedResult, setSubmittedResult] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!courseId || !applicationId) {
        setError("Missing course_id or application_id in URL.");
        setLoading(false);
        return;
      }
      try {
        const resp = await apiRequest<LoadResponse>(
          `/api/v1/academy/tests/student?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}&course_id=${encodeURIComponent(courseId)}&application_id=${encodeURIComponent(applicationId)}`
        );
        if (cancelled) return;
        setData(resp);
        if (resp.latest_attempt && resp.latest_attempt.submitted_at) {
          setSubmittedResult(resp.latest_attempt);
        } else if (resp.latest_attempt) {
          setActiveAttempt(resp.latest_attempt);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load test.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [courseId, applicationId]);

  async function startAttempt() {
    if (!data?.item) return;
    setBusy(true);
    try {
      const resp = await apiRequest<{ ok: boolean; attempt: Attempt }>(
        `/api/v1/academy/tests/${encodeURIComponent(data.item.id)}/attempts/start?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}&application_id=${encodeURIComponent(applicationId)}`,
        { method: "POST" }
      );
      setActiveAttempt(resp.attempt);
      setSubmittedResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start attempt.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!activeAttempt || !data) return;
    if (Object.keys(answers).length === 0) {
      if (!confirm("You haven't answered any questions. Submit anyway?")) return;
    }
    setBusy(true);
    try {
      const resp = await apiRequest<{ ok: boolean; attempt: Attempt }>(
        `/api/v1/academy/tests/attempts/${encodeURIComponent(activeAttempt.id)}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            tenant_name: DEFAULT_TENANT,
            application_id: applicationId,
            answers: Object.entries(answers).map(([question_id, given_answer]) => ({ question_id, given_answer })),
          }),
        }
      );
      setSubmittedResult(resp.attempt);
      setActiveAttempt(null);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answers.");
    } finally {
      setBusy(false);
    }
  }

  const questionsSorted = useMemo(
    () => [...(data?.questions || [])].sort((a, b) => a.position - b.position),
    [data?.questions]
  );

  if (loading) return <p className="muted" style={{ padding: 24 }}>Loading test…</p>;
  if (error) return <p style={{ padding: 24, color: "#9b1c2c" }}>{error}</p>;
  if (!data?.item) {
    return (
      <section className="editorial-workbench-card" style={{ padding: 24 }}>
        <h3 className="editorial-workbench-title">No certification test configured for this course yet.</h3>
        <p className="muted" style={{ marginTop: 8 }}>Faculty will publish the test before week 15. Check back closer to the cohort end.</p>
        <Link className="button-secondary" href="/student" style={{ marginTop: 16, display: "inline-block" }}>Back to dashboard</Link>
      </section>
    );
  }

  if (submittedResult) {
    const passed = submittedResult.passed === true;
    return (
      <section className="editorial-workbench" style={{ padding: 24 }}>
        <section className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">{passed ? "You passed ✓" : "Not yet"}</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 12 }}>
            Score: {submittedResult.score_pct ?? 0}%
          </h2>
          <p className="editorial-workbench-subtitle">
            {submittedResult.earned_points ?? 0} of {submittedResult.total_points ?? 0} points
            {" · "}pass score: {data.item.pass_score}%
          </p>
          {passed ? (
            <p style={{ marginTop: 16, fontSize: 15 }}>
              Your certificate is being prepared. The placement team will reach out separately about your career-readiness window.
            </p>
          ) : (
            <p style={{ marginTop: 16, fontSize: 15 }}>
              You can retake the test on or after{" "}
              <strong>{formatDate(submittedResult.submitted_at) ? new Date(new Date(submittedResult.submitted_at!).getTime() + data.item.retake_days * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "later"}</strong>
              . Your certificate will still be issued, but the placement guarantee requires {data.item.pass_score}% on the test.
            </p>
          )}
          <Link className="button-secondary" href="/student" style={{ marginTop: 18, display: "inline-block" }}>Back to dashboard</Link>
        </section>
      </section>
    );
  }

  if (!data.can_attempt) {
    return (
      <section className="editorial-workbench-card" style={{ padding: 24 }}>
        <h3 className="editorial-workbench-title">
          {data.reason === "already_passed" ? "Already passed ✓" : "Retake not yet available"}
        </h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {data.reason === "already_passed"
            ? "You have already cleared this test."
            : data.can_attempt_after
              ? `Next attempt available on ${formatDate(data.can_attempt_after)}.`
              : "Please come back later."}
        </p>
        <Link className="button-secondary" href="/student" style={{ marginTop: 16, display: "inline-block" }}>Back to dashboard</Link>
      </section>
    );
  }

  if (!activeAttempt) {
    // Show the start screen — explain rules, then a Start button.
    return (
      <section className="editorial-workbench" style={{ padding: 24 }}>
        <section className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Certification test</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 12 }}>Ready when you are.</h2>
          <p className="editorial-workbench-subtitle">
            {questionsSorted.length} questions · pass score: {data.item.pass_score}% · retake window: {data.item.retake_days} days
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
            <li>Answer all questions on a single page. Use radio buttons to choose.</li>
            <li>Once you click <strong>Submit</strong>, the result is final for this attempt.</li>
            <li>If you don&apos;t reach {data.item.pass_score}%, you can retake after {data.item.retake_days} days.</li>
            <li>Your certificate is issued either way — but the placement guarantee needs {data.item.pass_score}%.</li>
          </ul>
          <button className="button-primary" onClick={() => void startAttempt()} disabled={busy} style={{ marginTop: 18 }}>
            {busy ? "Starting…" : "Start test"}
          </button>
        </section>
      </section>
    );
  }

  // Active attempt — render questions.
  return (
    <section className="editorial-workbench" style={{ padding: 24 }}>
      <section className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Test in progress</div>
        <h2 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          {questionsSorted.length} questions · {data.item.pass_score}% to pass
        </h2>
      </section>
      {questionsSorted.map((q, idx) => (
        <section key={q.id} className="editorial-workbench-card">
          <div className="eyebrow">Question {idx + 1} · {q.points} {q.points === 1 ? "point" : "points"}</div>
          <p style={{ marginTop: 10, fontSize: 16, fontWeight: 500 }}>{q.prompt}</p>
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {q.type === "true_false" ? (
              ["true", "false"].map((opt) => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                  />
                  <span style={{ textTransform: "capitalize" }}>{opt}</span>
                </label>
              ))
            ) : (
              q.options.map((opt) => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                  />
                  <span>{opt}</span>
                </label>
              ))
            )}
          </div>
        </section>
      ))}
      <div className="button-row" style={{ marginTop: 12 }}>
        <button className="button-primary" onClick={() => void submit()} disabled={busy}>
          {busy ? "Submitting…" : "Submit test"}
        </button>
        <Link className="button-secondary" href="/student">Cancel</Link>
      </div>
      {error ? <p style={{ marginTop: 12, fontSize: 13, color: "#9b1c2c" }}>{error}</p> : null}
    </section>
  );
}
