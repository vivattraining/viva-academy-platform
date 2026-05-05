"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { readSession } from "../lib/auth";

type ApprovalStatus = "pending_review" | "approved" | "changes_requested" | "rejected";

type TrainerProfile = {
  id?: string;
  full_name?: string;
  email?: string;
  photo_url?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  specializations?: string[] | null;
  linkedin_url?: string | null;
  years_experience?: number | null;
  certifications?: string[] | null;
  approval_status?: ApprovalStatus | null;
  approval_note?: string | null;
};

type ProfileResponse = { profile: TrainerProfile | null };

const BIO_LIMIT = 500;

function chipsToString(items: string[] | null | undefined): string {
  if (!items || !items.length) return "";
  return items.join(", ");
}

function stringToChips(value: string): string[] {
  return value
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean);
}

export function TrainerProfileWorkspace() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionFullName, setSessionFullName] = useState<string>("");
  const [sessionEmail, setSessionEmail] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState<TrainerProfile | null>(null);

  // Editable form state
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [certifications, setCertifications] = useState("");

  // Wizard state (only used on first-time creation)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const session = readSession();
    setSessionToken(session?.session_token || null);
    setSessionFullName(session?.full_name || "");
    setSessionEmail(session?.email || "");
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    void loadProfile(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  function hydrateForm(p: TrainerProfile | null) {
    setPhotoUrl(p?.photo_url || "");
    setBio(p?.bio || "");
    setExpertise(chipsToString(p?.expertise));
    setSpecializations(chipsToString(p?.specializations));
    setLinkedinUrl(p?.linkedin_url || "");
    setYearsExperience(
      typeof p?.years_experience === "number" ? String(p.years_experience) : ""
    );
    setCertifications(chipsToString(p?.certifications));
  }

  async function loadProfile(token: string) {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest<ProfileResponse>(
        `/api/v1/academy/trainers/me/profile/secure?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`,
        { sessionToken: token }
      );
      setProfile(data.profile);
      hydrateForm(data.profile);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load your trainer profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(opts: { fromWizard?: boolean } = {}) {
    if (!sessionToken) {
      setSaveError("Trainer session required.");
      return;
    }
    if (bio.length > BIO_LIMIT) {
      setSaveError(`Bio must be ${BIO_LIMIT} characters or fewer.`);
      return;
    }
    const yearsNum = yearsExperience.trim() === "" ? null : Number(yearsExperience);
    if (
      yearsNum !== null &&
      (Number.isNaN(yearsNum) || yearsNum < 0 || yearsNum > 50)
    ) {
      setSaveError("Years of experience must be between 0 and 50.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const body = {
        tenant_name: DEFAULT_TENANT,
        full_name: sessionFullName,
        photo_url: photoUrl.trim() || null,
        bio: bio.trim(),
        expertise: stringToChips(expertise),
        specializations: stringToChips(specializations),
        linkedin_url: linkedinUrl.trim() || null,
        years_experience: yearsNum,
        certifications: stringToChips(certifications),
      };
      await apiRequest("/api/v1/academy/trainers/me/profile/secure", {
        method: "POST",
        sessionToken,
        body: JSON.stringify(body),
      });
      setSaveMessage(
        opts.fromWizard
          ? "Profile submitted for admin review."
          : "Profile saved. Edits will trigger re-review by the admin team."
      );
      await loadProfile(sessionToken);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const status: ApprovalStatus | null = profile?.approval_status ?? null;
  const isFirstTime = !loading && !loadError && profile === null;

  // ---------- Render branches ----------

  if (loading) {
    return (
      <article className="editorial-workbench-card">Loading your trainer profile…</article>
    );
  }

  if (loadError) {
    return (
      <article className="editorial-workbench-card">
        <div className="eyebrow">Trainer profile</div>
        <p style={{ marginTop: 12 }}>{loadError}</p>
      </article>
    );
  }

  return (
    <section className="editorial-workbench">
      <article className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Trainer profile</div>
        <h1 className="editorial-workbench-title" style={{ marginTop: 12 }}>
          {isFirstTime ? "Tell learners who you are." : "Manage your public profile."}
        </h1>
        <p className="editorial-workbench-subtitle">
          {isFirstTime
            ? "Three short steps. After you submit, the admin team reviews your profile before it appears on the public /trainers page."
            : "Edits trigger a fresh review before they go live on the public /trainers page."}
        </p>
      </article>

      {!isFirstTime ? <ApprovalBanner status={status} note={profile?.approval_note} /> : null}

      {isFirstTime ? (
        <WizardView
          step={wizardStep}
          setStep={setWizardStep}
          fullName={sessionFullName}
          email={sessionEmail}
          photoUrl={photoUrl}
          setPhotoUrl={setPhotoUrl}
          bio={bio}
          setBio={setBio}
          expertise={expertise}
          setExpertise={setExpertise}
          specializations={specializations}
          setSpecializations={setSpecializations}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          yearsExperience={yearsExperience}
          setYearsExperience={setYearsExperience}
          certifications={certifications}
          setCertifications={setCertifications}
          saving={saving}
          saveError={saveError}
          saveMessage={saveMessage}
          onSubmit={() => void saveProfile({ fromWizard: true })}
        />
      ) : (
        <EditView
          fullName={sessionFullName}
          email={sessionEmail}
          photoUrl={photoUrl}
          setPhotoUrl={setPhotoUrl}
          bio={bio}
          setBio={setBio}
          expertise={expertise}
          setExpertise={setExpertise}
          specializations={specializations}
          setSpecializations={setSpecializations}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          yearsExperience={yearsExperience}
          setYearsExperience={setYearsExperience}
          certifications={certifications}
          setCertifications={setCertifications}
          saving={saving}
          saveError={saveError}
          saveMessage={saveMessage}
          onSave={() => void saveProfile()}
        />
      )}
    </section>
  );
}

// ---------- subviews ----------

function ApprovalBanner({
  status,
  note,
}: {
  status: ApprovalStatus | null;
  note?: string | null;
}) {
  if (!status) return null;
  if (status === "pending_review") {
    return (
      <article
        className="editorial-workbench-card"
        style={{
          background: "#fdf3d9",
          borderColor: "#e7c97c",
        }}
      >
        <div className="eyebrow">Awaiting review</div>
        <p style={{ marginTop: 10 }}>
          Your profile is with the admin team for approval. You&rsquo;ll get an email when
          it&rsquo;s reviewed.
        </p>
      </article>
    );
  }
  if (status === "approved") {
    return (
      <article
        className="editorial-workbench-card"
        style={{
          background: "#e6f3ea",
          borderColor: "#7fb992",
        }}
      >
        <div className="eyebrow">Live</div>
        <p style={{ marginTop: 10 }}>
          Your profile is live on the public <strong>/trainers</strong> page. Any edit
          you save here will move you back into review before changes appear publicly.
        </p>
      </article>
    );
  }
  if (status === "changes_requested") {
    return (
      <article
        className="editorial-workbench-card"
        style={{
          background: "#fdf3d9",
          borderColor: "#e7a04a",
        }}
      >
        <div className="eyebrow">Changes requested</div>
        <p style={{ marginTop: 10 }}>
          Admin requested changes
          {note ? <>: <em>{note}</em></> : "."}
        </p>
        <p style={{ marginTop: 6, fontSize: 13, color: "#6b5b2c" }}>
          Update the fields below and save. Your profile will return to pending review.
        </p>
      </article>
    );
  }
  if (status === "rejected") {
    return (
      <article
        className="editorial-workbench-card"
        style={{
          background: "#f7e6e2",
          borderColor: "#e3b9b1",
        }}
      >
        <div className="eyebrow">Not approved</div>
        <p style={{ marginTop: 10 }}>
          {note
            ? <>Admin note: <em>{note}</em></>
            : "Please contact the admin team for next steps."}
        </p>
      </article>
    );
  }
  return null;
}

type FieldsProps = {
  fullName: string;
  email: string;
  photoUrl: string;
  setPhotoUrl: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  expertise: string;
  setExpertise: (v: string) => void;
  specializations: string;
  setSpecializations: (v: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (v: string) => void;
  yearsExperience: string;
  setYearsExperience: (v: string) => void;
  certifications: string;
  setCertifications: (v: string) => void;
};

function IdentitySection({
  fullName,
  email,
  photoUrl,
  setPhotoUrl,
}: Pick<FieldsProps, "fullName" | "email" | "photoUrl" | "setPhotoUrl">) {
  return (
    <div className="editorial-form-grid">
      <label className="editorial-form-field">
        <span>Full name</span>
        <input className="editorial-input" value={fullName} readOnly disabled />
      </label>
      <label className="editorial-form-field">
        <span>Email</span>
        <input className="editorial-input" value={email} readOnly disabled />
      </label>
      <label className="editorial-form-field" style={{ gridColumn: "1 / -1" }}>
        <span>Photo URL</span>
        <input
          className="editorial-input"
          type="url"
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          placeholder="https://media.licdn.com/..."
        />
        <small className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          Paste a public photo URL — your LinkedIn profile picture works. We&rsquo;ll add
          direct upload later.
        </small>
      </label>
    </div>
  );
}

function StorySection({
  bio,
  setBio,
  expertise,
  setExpertise,
}: Pick<FieldsProps, "bio" | "setBio" | "expertise" | "setExpertise">) {
  const remaining = BIO_LIMIT - bio.length;
  return (
    <div className="editorial-form-grid">
      <label className="editorial-form-field" style={{ gridColumn: "1 / -1" }}>
        <span>Short bio</span>
        <textarea
          className="editorial-input"
          rows={5}
          maxLength={BIO_LIMIT}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Two or three sentences on your career and what you teach."
        />
        <small
          className="muted"
          style={{
            marginTop: 6,
            fontSize: 12,
            color: remaining < 0 ? "#a23a3a" : undefined,
          }}
        >
          {remaining} characters left
        </small>
      </label>
      <label className="editorial-form-field" style={{ gridColumn: "1 / -1" }}>
        <span>Expertise (comma-separated)</span>
        <input
          className="editorial-input"
          value={expertise}
          onChange={(event) => setExpertise(event.target.value)}
          placeholder="GDS, Amadeus, Travel Operations"
        />
      </label>
    </div>
  );
}

function CredentialsSection({
  specializations,
  setSpecializations,
  linkedinUrl,
  setLinkedinUrl,
  yearsExperience,
  setYearsExperience,
  certifications,
  setCertifications,
}: Pick<
  FieldsProps,
  | "specializations"
  | "setSpecializations"
  | "linkedinUrl"
  | "setLinkedinUrl"
  | "yearsExperience"
  | "setYearsExperience"
  | "certifications"
  | "setCertifications"
>) {
  return (
    <div className="editorial-form-grid">
      <label className="editorial-form-field" style={{ gridColumn: "1 / -1" }}>
        <span>Specializations (comma-separated)</span>
        <input
          className="editorial-input"
          value={specializations}
          onChange={(event) => setSpecializations(event.target.value)}
          placeholder="Cabin crew training, Airport operations"
        />
      </label>
      <label className="editorial-form-field">
        <span>LinkedIn URL</span>
        <input
          className="editorial-input"
          type="url"
          value={linkedinUrl}
          onChange={(event) => setLinkedinUrl(event.target.value)}
          placeholder="https://linkedin.com/in/..."
        />
      </label>
      <label className="editorial-form-field">
        <span>Years of experience</span>
        <input
          className="editorial-input"
          type="number"
          min={0}
          max={50}
          value={yearsExperience}
          onChange={(event) => setYearsExperience(event.target.value)}
        />
      </label>
      <label className="editorial-form-field" style={{ gridColumn: "1 / -1" }}>
        <span>Certifications (comma-separated)</span>
        <input
          className="editorial-input"
          value={certifications}
          onChange={(event) => setCertifications(event.target.value)}
          placeholder="IATA Certified, NCVT Trainer"
        />
      </label>
    </div>
  );
}

function WizardView(
  props: FieldsProps & {
    step: 1 | 2 | 3;
    setStep: (s: 1 | 2 | 3) => void;
    saving: boolean;
    saveError: string;
    saveMessage: string;
    onSubmit: () => void;
  }
) {
  const { step, setStep, saving, saveError, saveMessage, onSubmit } = props;

  const summary = useMemo(
    () => ({
      photoUrl: props.photoUrl,
      bio: props.bio,
      expertise: stringToChips(props.expertise),
      specializations: stringToChips(props.specializations),
      linkedinUrl: props.linkedinUrl,
      yearsExperience: props.yearsExperience,
      certifications: stringToChips(props.certifications),
    }),
    [
      props.photoUrl,
      props.bio,
      props.expertise,
      props.specializations,
      props.linkedinUrl,
      props.yearsExperience,
      props.certifications,
    ]
  );

  return (
    <article className="editorial-workbench-card">
      <div className="eyebrow">Step {step} of 3</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 10, fontSize: "1.6rem" }}>
        {step === 1
          ? "Identity & photo"
          : step === 2
          ? "Bio & expertise"
          : "Review & submit"}
      </h2>

      <div style={{ marginTop: 18 }}>
        {step === 1 ? (
          <IdentitySection
            fullName={props.fullName}
            email={props.email}
            photoUrl={props.photoUrl}
            setPhotoUrl={props.setPhotoUrl}
          />
        ) : null}
        {step === 2 ? (
          <>
            <StorySection
              bio={props.bio}
              setBio={props.setBio}
              expertise={props.expertise}
              setExpertise={props.setExpertise}
            />
            <div style={{ marginTop: 16 }}>
              <CredentialsSection
                specializations={props.specializations}
                setSpecializations={props.setSpecializations}
                linkedinUrl={props.linkedinUrl}
                setLinkedinUrl={props.setLinkedinUrl}
                yearsExperience={props.yearsExperience}
                setYearsExperience={props.setYearsExperience}
                certifications={props.certifications}
                setCertifications={props.setCertifications}
              />
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <div className="stack">
            <div className="editorial-workbench-panel">
              <strong>{props.fullName}</strong>
              <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                {props.email}
              </p>
              {summary.photoUrl ? (
                <p className="muted" style={{ marginTop: 6, fontSize: 12, wordBreak: "break-all" }}>
                  Photo: {summary.photoUrl}
                </p>
              ) : null}
              {summary.bio ? (
                <p style={{ marginTop: 10 }}>{summary.bio}</p>
              ) : (
                <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>No bio yet.</p>
              )}
              <div className="editorial-workbench-meta" style={{ marginTop: 10 }}>
                {summary.expertise.map((chip) => (
                  <span key={`exp-${chip}`} className="editorial-workbench-chip">
                    {chip}
                  </span>
                ))}
                {summary.specializations.map((chip) => (
                  <span key={`spec-${chip}`} className="editorial-workbench-chip">
                    {chip}
                  </span>
                ))}
                {summary.yearsExperience ? (
                  <span className="editorial-workbench-chip">
                    {summary.yearsExperience} yrs
                  </span>
                ) : null}
              </div>
              {summary.certifications.length ? (
                <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                  Certifications: {summary.certifications.join(", ")}
                </p>
              ) : null}
              {summary.linkedinUrl ? (
                <p className="muted" style={{ marginTop: 6, fontSize: 13, wordBreak: "break-all" }}>
                  LinkedIn: {summary.linkedinUrl}
                </p>
              ) : null}
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              When you submit, the admin team is notified and reviews your profile before
              it appears publicly.
            </p>
          </div>
        ) : null}
      </div>

      {saveError ? (
        <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
          {saveError}
        </div>
      ) : null}
      {saveMessage ? (
        <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
          {saveMessage}
        </div>
      ) : null}

      <div className="button-row">
        {step > 1 ? (
          <button
            className="button-secondary"
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            disabled={saving}
          >
            Back
          </button>
        ) : null}
        {step < 3 ? (
          <button
            className="button-primary"
            onClick={() => setStep((step + 1) as 1 | 2 | 3)}
          >
            Continue
          </button>
        ) : (
          <button
            className="button-primary"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Submitting…" : "Submit for review"}
          </button>
        )}
      </div>
    </article>
  );
}

function EditView(
  props: FieldsProps & {
    saving: boolean;
    saveError: string;
    saveMessage: string;
    onSave: () => void;
  }
) {
  return (
    <article className="editorial-workbench-card">
      <div className="eyebrow">Edit profile</div>
      <div style={{ marginTop: 18 }}>
        <IdentitySection
          fullName={props.fullName}
          email={props.email}
          photoUrl={props.photoUrl}
          setPhotoUrl={props.setPhotoUrl}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <StorySection
          bio={props.bio}
          setBio={props.setBio}
          expertise={props.expertise}
          setExpertise={props.setExpertise}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <CredentialsSection
          specializations={props.specializations}
          setSpecializations={props.setSpecializations}
          linkedinUrl={props.linkedinUrl}
          setLinkedinUrl={props.setLinkedinUrl}
          yearsExperience={props.yearsExperience}
          setYearsExperience={props.setYearsExperience}
          certifications={props.certifications}
          setCertifications={props.setCertifications}
        />
      </div>

      {props.saveError ? (
        <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
          {props.saveError}
        </div>
      ) : null}
      {props.saveMessage ? (
        <div className="editorial-workbench-panel" style={{ marginTop: 16 }}>
          {props.saveMessage}
        </div>
      ) : null}

      <div className="button-row">
        <button
          className="button-primary"
          onClick={props.onSave}
          disabled={props.saving}
        >
          {props.saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </article>
  );
}
