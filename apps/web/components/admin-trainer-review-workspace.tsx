"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type ApprovalStatus = "pending_review" | "approved" | "changes_requested" | "rejected";

type TrainerProfileRow = {
  id: string;
  full_name: string;
  email: string;
  photo_url?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  specializations?: string[] | null;
  linkedin_url?: string | null;
  years_experience?: number | null;
  certifications?: string[] | null;
  approval_status: ApprovalStatus;
  approval_note?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
};

type FilterId = "pending_review" | "approved" | "changes_requested" | "rejected" | "all";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "pending_review", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "changes_requested", label: "Changes requested" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function initials(name: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase() || "")
    .join("") || "?";
}

function daysAgo(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const ms = Date.now() - parsed.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function AdminTrainerReviewWorkspace() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("pending_review");
  const [items, setItems] = useState<TrainerProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [modalProfile, setModalProfile] = useState<TrainerProfileRow | null>(null);
  const [modalAction, setModalAction] = useState<"changes_requested" | "rejected" | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [modalBusy, setModalBusy] = useState(false);

  useEffect(() => {
    setSessionToken(readSession()?.session_token || null);
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    void loadProfiles(sessionToken, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, filter]);

  async function loadProfiles(token: string, current: FilterId) {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ tenant_name: DEFAULT_TENANT });
      if (current !== "all") {
        params.set("status", current);
      }
      const data = await apiRequest<{ items: TrainerProfileRow[] }>(
        `/api/v1/academy/trainers/profiles/secure?${params.toString()}`,
        { sessionToken: token }
      );
      setItems(data.items || []);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load trainer profiles."
      );
    } finally {
      setLoading(false);
    }
  }

  async function approve(profile: TrainerProfileRow) {
    if (!sessionToken) return;
    setActionMessage("");
    setActionError("");
    try {
      await apiRequest(
        `/api/v1/academy/trainers/profiles/${encodeURIComponent(profile.id)}/approval/secure`,
        {
          method: "POST",
          sessionToken,
          body: JSON.stringify({
            tenant_name: DEFAULT_TENANT,
            status: "approved",
            note: "",
          }),
        }
      );
      setActionMessage(`${profile.full_name} approved.`);
      await loadProfiles(sessionToken, filter);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to approve profile."
      );
    }
  }

  function openModal(profile: TrainerProfileRow, action: "changes_requested" | "rejected") {
    setModalProfile(profile);
    setModalAction(action);
    setModalNote("");
  }

  function closeModal() {
    setModalProfile(null);
    setModalAction(null);
    setModalNote("");
    setModalBusy(false);
  }

  async function submitModal() {
    if (!sessionToken || !modalProfile || !modalAction) return;
    setModalBusy(true);
    setActionMessage("");
    setActionError("");
    try {
      await apiRequest(
        `/api/v1/academy/trainers/profiles/${encodeURIComponent(modalProfile.id)}/approval/secure`,
        {
          method: "POST",
          sessionToken,
          body: JSON.stringify({
            tenant_name: DEFAULT_TENANT,
            status: modalAction,
            note: modalNote.trim(),
          }),
        }
      );
      setActionMessage(
        modalAction === "rejected"
          ? `${modalProfile.full_name} rejected.`
          : `Changes requested from ${modalProfile.full_name}.`
      );
      closeModal();
      await loadProfiles(sessionToken, filter);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to record decision."
      );
      setModalBusy(false);
    }
  }

  const empty = !loading && !loadError && items.length === 0;

  return (
    <section className="editorial-workbench">
      <article className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Trainer review</div>
        <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          Approve faculty profiles before they go public.
        </h1>
        <p className="editorial-workbench-subtitle">
          Trainers self-serve their profile. Nothing appears on the public /trainers page
          until you approve it.
        </p>
        <div
          className="button-row"
          role="tablist"
          aria-label="Trainer review filters"
          style={{ marginTop: 18, flexWrap: "wrap" }}
        >
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filter === tab.id}
              className={filter === tab.id ? "button-active" : "button-toggle"}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </article>

      {actionMessage ? (
        <article className="editorial-workbench-card" style={{ background: "#e6f3ea", borderColor: "#7fb992" }}>
          {actionMessage}
        </article>
      ) : null}
      {actionError ? (
        <article className="editorial-workbench-card" style={{ background: "#f7e6e2", borderColor: "#e3b9b1" }}>
          {actionError}
        </article>
      ) : null}

      {loading ? (
        <article className="editorial-workbench-card">Loading trainer profiles…</article>
      ) : loadError ? (
        <article className="editorial-workbench-card">{loadError}</article>
      ) : empty ? (
        <article className="editorial-workbench-card">
          <div className="eyebrow">Empty</div>
          <p style={{ marginTop: 10 }}>No profiles match this filter.</p>
        </article>
      ) : (
        <article className="editorial-workbench-card">
          <div className="eyebrow">{items.length} profile{items.length === 1 ? "" : "s"}</div>
          <div className="stack" style={{ marginTop: 16 }}>
            {items.map((profile) => (
              <ProfileRow
                key={profile.id}
                profile={profile}
                onApprove={() => void approve(profile)}
                onRequestChanges={() => openModal(profile, "changes_requested")}
                onReject={() => openModal(profile, "rejected")}
              />
            ))}
          </div>
        </article>
      )}

      {modalProfile && modalAction ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modalAction === "rejected" ? "Reject profile" : "Request changes"}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 31, 58, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 1000,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="editorial-workbench-card"
            style={{ width: "100%", maxWidth: 520, background: "white" }}
          >
            <div className="eyebrow">
              {modalAction === "rejected" ? "Reject profile" : "Request changes"}
            </div>
            <h2
              className="editorial-workbench-title"
              style={{ marginTop: 12, fontSize: "1.4rem" }}
            >
              {modalProfile.full_name}
            </h2>
            <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              {modalProfile.email}
            </p>
            <label
              className="editorial-form-field"
              style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span>Note for the trainer</span>
              <textarea
                className="editorial-input"
                rows={4}
                value={modalNote}
                onChange={(event) => setModalNote(event.target.value)}
                placeholder={
                  modalAction === "rejected"
                    ? "Explain why this profile cannot be approved."
                    : "What needs to change before approval?"
                }
              />
            </label>
            <div className="button-row">
              <button
                className="button-primary"
                onClick={() => void submitModal()}
                disabled={modalBusy}
              >
                {modalBusy
                  ? "Saving…"
                  : modalAction === "rejected"
                  ? "Reject profile"
                  : "Request changes"}
              </button>
              <button
                className="button-secondary"
                onClick={closeModal}
                disabled={modalBusy}
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

function ProfileRow({
  profile,
  onApprove,
  onRequestChanges,
  onReject,
}: {
  profile: TrainerProfileRow;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
}) {
  const expertise = useMemo(
    () => (profile.expertise || []).slice(0, 6),
    [profile.expertise]
  );
  const status = profile.approval_status;
  return (
    <div className="editorial-workbench-panel">
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: "#0B1F3A",
            color: "#fffaf2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_url}
              alt={profile.full_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials(profile.full_name)
          )}
        </div>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <strong style={{ display: "block" }}>{profile.full_name}</strong>
          <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            {profile.email}
          </p>
          <div className="editorial-workbench-meta" style={{ marginTop: 8 }}>
            {expertise.map((chip) => (
              <span key={chip} className="editorial-workbench-chip">
                {chip}
              </span>
            ))}
            <span className="editorial-workbench-chip">
              Submitted {daysAgo(profile.submitted_at || profile.updated_at)}
            </span>
          </div>
          {profile.bio ? (
            <p style={{ marginTop: 10, fontSize: 14 }}>{profile.bio}</p>
          ) : null}
          {profile.linkedin_url ? (
            <p
              className="muted"
              style={{ marginTop: 6, fontSize: 12, wordBreak: "break-all" }}
            >
              LinkedIn:{" "}
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                {profile.linkedin_url}
              </a>
            </p>
          ) : null}
          {profile.approval_note ? (
            <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Last note: <em>{profile.approval_note}</em>
            </p>
          ) : null}
        </div>
        <div style={{ minWidth: 140 }}>
          <span
            className={`editorial-status ${
              status === "approved"
                ? "info"
                : status === "rejected"
                ? "warning"
                : "neutral"
            }`}
          >
            {status === "pending_review"
              ? "Pending"
              : status === "approved"
              ? "Approved"
              : status === "changes_requested"
              ? "Changes requested"
              : "Rejected"}
          </span>
        </div>
      </div>

      <div className="button-row" style={{ marginTop: 14 }}>
        <button
          className="button-primary"
          onClick={onApprove}
          disabled={status === "approved"}
        >
          Approve
        </button>
        <button className="button-secondary" onClick={onRequestChanges}>
          Request changes
        </button>
        <button className="button-secondary" onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
