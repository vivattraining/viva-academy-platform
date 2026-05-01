"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

type Course = {
  id: string;
  code: string;
  title: string;
};

type Test = {
  id: string;
  course_id: string;
  pass_score: number;
  retake_days: number;
  active: boolean;
};

type Question = {
  id: string;
  test_id: string;
  prompt: string;
  type: "true_false" | "multiple_choice";
  options: string[];
  correct_answer: string;
  points: number;
  position: number;
};

type CoursesResponse = {
  items: Array<{ course: Course }>;
};

type TestResponse = {
  item: Test | null;
  questions: Question[];
};

const EMPTY_NEW_QUESTION = {
  prompt: "",
  type: "true_false" as "true_false" | "multiple_choice",
  optionsText: "",
  correct_answer: "true",
  points: 1,
  position: 1,
};

export function AdminTestEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passScore, setPassScore] = useState(75);
  const [retakeDays, setRetakeDays] = useState(14);
  const [newQuestion, setNewQuestion] = useState(EMPTY_NEW_QUESTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load courses on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiRequest<CoursesResponse>(
          `/api/v1/academy/courses/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
        );
        if (cancelled) return;
        const list = (data.items || []).map((it) => it.course).filter(Boolean);
        setCourses(list);
        if (list.length && !selectedCourseId) setSelectedCourseId(list[0].id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the test for the selected course.
  useEffect(() => {
    if (!selectedCourseId) return;
    let cancelled = false;
    async function loadTest() {
      try {
        const data = await apiRequest<TestResponse>(
          `/api/v1/academy/tests/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}&course_id=${encodeURIComponent(selectedCourseId)}`
        );
        if (cancelled) return;
        setTest(data.item);
        setQuestions(data.questions || []);
        if (data.item) {
          setPassScore(data.item.pass_score);
          setRetakeDays(data.item.retake_days);
        } else {
          setPassScore(75);
          setRetakeDays(14);
        }
        setMessage("");
        setError("");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load test.");
      }
    }
    void loadTest();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId]);

  async function saveTest() {
    if (!selectedCourseId) return;
    setSaving(true);
    try {
      const data = await apiRequest<{ ok: boolean; item: Test }>("/api/v1/academy/tests/secure", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          course_id: selectedCourseId,
          pass_score: passScore,
          retake_days: retakeDays,
          active: true,
        }),
      });
      setTest(data.item);
      setQuestions([]);
      setMessage("Test settings saved. Add questions below.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save test.");
    } finally {
      setSaving(false);
    }
  }

  async function addQuestion() {
    if (!test) return;
    if (!newQuestion.prompt.trim()) {
      setError("Question prompt is required.");
      return;
    }
    const options = newQuestion.type === "multiple_choice"
      ? newQuestion.optionsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
    if (newQuestion.type === "multiple_choice") {
      if (options.length < 2) {
        setError("Multi-choice questions need at least 2 options (one per line).");
        return;
      }
      if (!options.includes(newQuestion.correct_answer)) {
        setError("Correct answer must match one of the options exactly.");
        return;
      }
    }
    setSaving(true);
    try {
      const data = await apiRequest<{ ok: boolean; item: Question }>(
        `/api/v1/academy/tests/${encodeURIComponent(test.id)}/questions/secure`,
        {
          method: "POST",
          body: JSON.stringify({
            tenant_name: DEFAULT_TENANT,
            test_id: test.id,
            prompt: newQuestion.prompt.trim(),
            type: newQuestion.type,
            options,
            correct_answer: newQuestion.correct_answer.trim(),
            points: newQuestion.points,
            position: newQuestion.position || questions.length + 1,
          }),
        }
      );
      setQuestions((prev) => [...prev, data.item].sort((a, b) => a.position - b.position));
      setNewQuestion({ ...EMPTY_NEW_QUESTION, position: questions.length + 2 });
      setMessage(`Question added (${questions.length + 1} total).`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add question.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(question_id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setSaving(true);
    try {
      await apiRequest(
        `/api/v1/academy/tests/questions/${encodeURIComponent(question_id)}/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { method: "DELETE" }
      );
      setQuestions((prev) => prev.filter((q) => q.id !== question_id));
      setMessage("Question deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="editorial-workbench-card" style={{ marginTop: 24 }}>
      <div className="eyebrow">Certification test</div>
      <h3 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "1.4rem" }}>
        Online test &amp; auto-grading
      </h3>
      <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
        Configure the certification test for a course. Y/N or multiple-choice
        questions, pass score in percent, and retake window in days. Students
        see the test once their course is complete.
      </p>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading courses…</p>
      ) : courses.length === 0 ? (
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          No courses found. Use the P·01 import endpoint or the LMS console
          above to create a course first.
        </p>
      ) : (
        <>
          <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "1fr" }}>
            <label className="editorial-field">
              <span>Course</span>
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} · {c.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <label className="editorial-field">
              <span>Pass score (%)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={passScore}
                onChange={(e) => setPassScore(parseInt(e.target.value || "0", 10))}
              />
            </label>
            <label className="editorial-field">
              <span>Retake window (days)</span>
              <input
                type="number"
                min={0}
                max={90}
                value={retakeDays}
                onChange={(e) => setRetakeDays(parseInt(e.target.value || "0", 10))}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="button-primary" onClick={() => void saveTest()} disabled={saving}>
              {test ? "Update test settings" : "Create test"}
            </button>
            {test ? (
              <span className="muted" style={{ marginLeft: 12, fontSize: 12 }}>
                Test ID: <code style={{ fontFamily: "ui-monospace, monospace" }}>{test.id}</code>
              </span>
            ) : null}
          </div>

          {test ? (
            <>
              <h4 style={{ marginTop: 24, fontSize: "1.05rem", fontWeight: 600 }}>
                Questions ({questions.length})
              </h4>
              {questions.length === 0 ? (
                <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  No questions yet. Add the first one below.
                </p>
              ) : (
                <ol style={{ marginTop: 12, paddingLeft: 20, display: "grid", gap: 12 }}>
                  {questions.map((q) => (
                    <li key={q.id} style={{ background: "var(--color-background-secondary, #f5efe4)", padding: "12px 14px", borderRadius: 6, border: "0.5px solid #d8cfbe" }}>
                      <div style={{ fontWeight: 500, marginBottom: 6 }}>{q.prompt}</div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                        {q.type === "true_false" ? "True / False" : `Multiple choice · ${q.options.length} options`}
                        {" · "}
                        {q.points} {q.points === 1 ? "point" : "points"}
                      </div>
                      {q.type === "multiple_choice" ? (
                        <ul style={{ fontSize: 13, marginLeft: 16, marginBottom: 8 }}>
                          {q.options.map((opt) => (
                            <li key={opt} style={{ color: opt === q.correct_answer ? "#1f7a3a" : "var(--muted, #2f3140)" }}>
                              {opt}{opt === q.correct_answer ? "  ✓" : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ fontSize: 13, color: "#1f7a3a" }}>
                          Correct: <strong>{q.correct_answer}</strong>
                        </div>
                      )}
                      <button
                        className="button-secondary"
                        onClick={() => void deleteQuestion(q.id)}
                        disabled={saving}
                        style={{ marginTop: 6 }}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              <h4 style={{ marginTop: 24, fontSize: "1.05rem", fontWeight: 600 }}>Add a new question</h4>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <label className="editorial-field">
                  <span>Question prompt</span>
                  <textarea
                    rows={3}
                    value={newQuestion.prompt}
                    onChange={(e) => setNewQuestion({ ...newQuestion, prompt: e.target.value })}
                    placeholder="e.g. A Schengen visa allows entry to the United Kingdom."
                  />
                </label>
                <label className="editorial-field">
                  <span>Type</span>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({
                      ...newQuestion,
                      type: e.target.value as "true_false" | "multiple_choice",
                      correct_answer: e.target.value === "true_false" ? "true" : "",
                    })}
                  >
                    <option value="true_false">True / False</option>
                    <option value="multiple_choice">Multiple choice</option>
                  </select>
                </label>
                {newQuestion.type === "multiple_choice" ? (
                  <label className="editorial-field">
                    <span>Options (one per line, ≥2 lines)</span>
                    <textarea
                      rows={4}
                      value={newQuestion.optionsText}
                      onChange={(e) => setNewQuestion({ ...newQuestion, optionsText: e.target.value })}
                      placeholder={"Option A\nOption B\nOption C"}
                    />
                  </label>
                ) : null}
                <label className="editorial-field">
                  <span>Correct answer {newQuestion.type === "multiple_choice" ? "(must match one option exactly)" : ""}</span>
                  {newQuestion.type === "true_false" ? (
                    <select
                      value={newQuestion.correct_answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newQuestion.correct_answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                    />
                  )}
                </label>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  <label className="editorial-field">
                    <span>Points</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newQuestion.points}
                      onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value || "1", 10) })}
                    />
                  </label>
                  <label className="editorial-field">
                    <span>Position (order)</span>
                    <input
                      type="number"
                      min={1}
                      value={newQuestion.position}
                      onChange={(e) => setNewQuestion({ ...newQuestion, position: parseInt(e.target.value || "1", 10) })}
                    />
                  </label>
                </div>
                <div>
                  <button className="button-primary" onClick={() => void addQuestion()} disabled={saving}>
                    {saving ? "Saving…" : "Add question"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {message ? <p style={{ marginTop: 12, fontSize: 13, color: "#1f7a3a" }}>{message}</p> : null}
      {error ? <p style={{ marginTop: 12, fontSize: 13, color: "#9b1c2c" }}>{error}</p> : null}
    </section>
  );
}
