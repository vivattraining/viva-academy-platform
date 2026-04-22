"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

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

export function TrainerReviewWorkspace() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewerName, setReviewerName] = useState("Trainer");

  async function load() {
    try {
      const data = await apiRequest<{ queue: QueueItem[] }>(
        `/api/v1/academy/reviews/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
      );
      setItems(data.queue || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load trainer review queue.");
    }
  }

  useEffect(() => {
    async function hydrate() {
      try {
        const me = await apiRequest<{ session: { full_name: string } }>(
          `/api/v1/academy/auth/me?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
        );
        setReviewerName(me.session.full_name);
      } catch {}
      await load();
    }
    void hydrate();
  }, []);

  async function reviewSubmission(submissionId: string, outcome: "pass" | "resubmit" | "fail") {
    setMessage("Saving trainer review...");
    try {
      await apiRequest("/api/v1/academy/reviews/secure", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          submission_id: submissionId,
          reviewer_name: reviewerName,
          outcome,
          score: outcome === "pass" ? 80 : outcome === "resubmit" ? 60 : 40,
          ai_feedback: "AI suggestion layer ready for enrichment once the OpenAI key is available.",
          trainer_feedback:
            outcome === "pass"
              ? "Approved. The learner can move forward."
              : outcome === "resubmit"
                ? "Resubmit with clearer reasoning and stronger structure."
                : "Needs deeper revision before progression.",
          unlock_next_module: outcome === "pass",
        }),
      });
      setMessage(`Review saved as ${outcome}.`);
      await load();
    } catch (reviewError) {
      setMessage(reviewError instanceof Error ? reviewError.message : "Unable to save trainer review.");
    }
  }

  if (error) {
    return <section className="card">{error}</section>;
  }

  return (
    <section className="grid grid-2">
      <article className="card">
        <div className="eyebrow">Evaluation queue</div>
        <div className="stack" style={{ marginTop: 16 }}>
          {items.length ? items.map((item) => (
            <div key={item.submission_id} className="panel">
              <strong>{item.student_name || "Learner"}</strong>
              <p className="muted">{item.module_title || item.course_name}</p>
              <p className="muted">{item.chapter_title}</p>
              <div className="badge-row"><span className="badge">{item.status}</span></div>
              <div className="button-row">
                <button className="button-primary" onClick={() => void reviewSubmission(item.submission_id, "pass")}>Pass</button>
                <button className="button-secondary" onClick={() => void reviewSubmission(item.submission_id, "resubmit")}>Resubmit</button>
                <button className="button-secondary" onClick={() => void reviewSubmission(item.submission_id, "fail")}>Fail</button>
              </div>
            </div>
          )) : <p className="muted">No submissions are waiting for trainer review right now.</p>}
        </div>
      </article>
      <article className="card">
        <div className="eyebrow">Review workflow</div>
        <p className="muted" style={{ marginTop: 12 }}>
          Trainers can now work against the live LMS queue, where each submission is tied to a learner, module, and chapter.
        </p>
        <div className="panel" style={{ marginTop: 16 }}>
          <strong>Next step</strong>
          <p className="muted">Trainer decisions now post directly to the LMS review API for pass, fail, and resubmission outcomes.</p>
        </div>
      </article>
      {message ? <article className="panel" style={{ gridColumn: "1 / -1" }}>{message}</article> : null}
    </section>
  );
}
