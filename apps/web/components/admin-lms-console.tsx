"use client";

import { useEffect, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";

type CourseOutline = {
  course: { id: string; title: string; certificate_name: string };
  modules: Array<{ id: string; title: string; week_number: number; chapters_total: number; chapters_completed: number; status: string }>;
  progress?: { current_week?: number } | null;
};

export function AdminLmsConsole() {
  const [items, setItems] = useState<CourseOutline[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await apiRequest<{ items: CourseOutline[] }>(
        `/api/v1/academy/courses/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`
      );
      setItems(data.items || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load LMS catalog.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCourse() {
    setMessage("Creating course...");
    try {
      await apiRequest("/api/v1/academy/courses/secure", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: DEFAULT_TENANT,
          title,
          slug,
          code,
          description: "Admin-created course shell",
          duration_weeks: 12,
          weekly_unlock_days: 7,
          penalty_fee_amount: 2000,
          penalty_fee_currency: "INR",
          relock_grace_days: 2,
          certificate_name: title,
          active: true,
        }),
      });
      setTitle("");
      setSlug("");
      setCode("");
      setMessage("Course created.");
      await load();
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "Unable to create course.");
    }
  }

  if (error) {
    return <section className="card">{error}</section>;
  }

  return (
    <section className="editorial-workbench-card">
      <div className="eyebrow">LMS catalog</div>
      <div className="editorial-form-grid" style={{ marginTop: 16 }}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="editorial-input" placeholder="Course title" />
        <input value={slug} onChange={(event) => setSlug(event.target.value)} className="editorial-input" placeholder="Course slug" />
        <input value={code} onChange={(event) => setCode(event.target.value)} className="editorial-input" placeholder="Course code" />
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={() => void createCourse()}>Create course shell</button>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {items.map((item) => (
          <div key={item.course.id} className="editorial-workbench-panel">
            <strong>{item.course.title}</strong>
            <p className="muted">{item.course.certificate_name}</p>
            <div className="badge-row" style={{ marginTop: 12 }}>
              <span className="badge">{item.modules.length} modules</span>
              {item.modules.slice(0, 3).map((module) => (
                <span key={module.id} className="badge">{module.title}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {message ? <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>{message}</div> : null}
    </section>
  );
}
