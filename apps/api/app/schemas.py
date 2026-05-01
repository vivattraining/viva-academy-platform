from typing import Optional

from pydantic import BaseModel, Field


class TenantBranding(BaseModel):
    tenant_name: str = Field(..., min_length=1)
    brand_name: str = Field(..., min_length=1)
    academy_name: str = Field(..., min_length=1)
    custom_domain: str = Field(..., min_length=1)
    primary_color: str = "#0B1F3A"
    accent_color: str = "#F4B400"
    support_email: str = "support@vivacareeracademy.com"
    certificate_name: str = "Professional Certification in Travel & Tourism"
    classroom_provider: str = "zoom"
    zoom_host_email: str = "tech@vivacareeracademy.com"
    zoom_default_timezone: str = "Asia/Kolkata"


class ApplicationCreate(BaseModel):
    tenant_name: str
    student_name: str
    student_email: str
    student_phone: str = ""
    # Either course_code (preferred) or course_name. Server resolves to the
    # canonical Course in apps/api/app/course_catalog.py and stamps the
    # authoritative course_name + course_fee on the row. amount_due from
    # the client is ignored (kept on the schema for backward compatibility
    # with older frontends, but the value is overwritten server-side).
    course_code: Optional[str] = None
    course_name: str = ""
    source: str = "website"
    notes: str = ""
    amount_due: float = 0  # ignored — see comment above
    currency: str = "INR"
    # Reserve-a-Seat flow: when true, the application is for a coming-soon
    # course and the student is paying the reservation fee (typically
    # ₹5,000) as advance. Balance is due within 14 days of cohort
    # announcement. Validated server-side against course.coming_soon and
    # course.reservation_fee_inr — clients cannot fake reservation status
    # for live courses.
    is_reservation: bool = False


class ApplicationStatusUpdate(BaseModel):
    tenant_name: str
    application_stage: Optional[str] = None
    payment_stage: Optional[str] = None
    enrollment_stage: Optional[str] = None
    certificate_url: Optional[str] = None
    batch_id: Optional[str] = None


class ApplicationAttendanceUpdate(BaseModel):
    tenant_name: str
    attendance_completed: Optional[int] = None
    attendance_total: Optional[int] = None


class PaymentLinkUpdate(BaseModel):
    tenant_name: str
    amount_due: Optional[float] = None
    currency: Optional[str] = None
    payment_order_id: Optional[str] = None
    payment_url: Optional[str] = None
    payment_reference: Optional[str] = None
    application_stage: Optional[str] = None
    payment_stage: Optional[str] = None


class PaymentVerificationRequest(BaseModel):
    tenant_name: str
    token: Optional[str] = None
    outcome: Optional[str] = None


class BatchCreate(BaseModel):
    tenant_name: str
    name: str
    course_name: str
    start_date: str
    trainer_name: str
    classroom_mode: str = "hybrid"
    classroom_link: str = ""
    zoom_meeting_id: Optional[str] = None
    capacity: int = 20


class SessionCreate(BaseModel):
    tenant_name: str
    batch_id: str
    title: str
    session_date: str
    start_time: str
    end_time: str
    trainer_name: str
    classroom_link: str = ""
    zoom_meeting_id: Optional[str] = None
    zoom_join_url: Optional[str] = None
    zoom_start_url: Optional[str] = None
    attendance_mode: str = "manual"


class SessionAttendanceUpdate(BaseModel):
    tenant_name: str
    application_id: str
    status: str
    marked_by: str = "trainer"
    join_source: str = "manual"
    join_time: Optional[str] = None
    note: str = ""


class SessionZoomUpdate(BaseModel):
    tenant_name: str
    classroom_link: Optional[str] = None
    zoom_meeting_id: Optional[str] = None
    zoom_join_url: Optional[str] = None
    zoom_start_url: Optional[str] = None
    attendance_mode: Optional[str] = None


class ZoomProvisionRequest(BaseModel):
    tenant_name: str
    session_id: str
    host_email: Optional[str] = None
    timezone: Optional[str] = None


class ZoomWebhookAttendance(BaseModel):
    tenant_name: str
    zoom_meeting_id: str
    participant_email: str
    join_time: Optional[str] = None
    note: str = ""


class LoginRequest(BaseModel):
    tenant_name: str
    email: str
    password: str
    expected_role: Optional[str] = None


class BootstrapAdminRequest(BaseModel):
    tenant_name: str
    full_name: str = Field(..., min_length=1)
    email: str
    password: str = Field(..., min_length=8)


class CredentialCreateRequest(BaseModel):
    tenant_name: str
    full_name: str = Field(..., min_length=1)
    email: str
    password: str = Field(..., min_length=8)
    role: str = Field(..., min_length=1)


class CredentialUpdateRequest(BaseModel):
    tenant_name: str
    email: str
    full_name: Optional[str] = Field(default=None, min_length=1)
    password: Optional[str] = Field(default=None, min_length=8)
    role: Optional[str] = Field(default=None, min_length=1)


class AuthSession(BaseModel):
    session_token: str
    access_token: str
    token_type: str = "bearer"
    tenant_name: str
    email: str
    full_name: str
    role: str
    created_at: str
    expires_at: str


class CourseCreate(BaseModel):
    tenant_name: str
    title: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    description: str = ""
    duration_weeks: int = 12
    weekly_unlock_days: int = 7
    penalty_fee_amount: float = 2000
    penalty_fee_currency: str = "INR"
    relock_grace_days: int = 2
    certificate_name: Optional[str] = None
    active: bool = True


class CourseModuleCreate(BaseModel):
    tenant_name: str
    course_id: str
    title: str = Field(..., min_length=1)
    week_number: int = Field(..., ge=1)
    summary: str = ""
    unlock_offset_days: Optional[int] = None
    submission_required: bool = True
    passing_score: float = 70
    penalty_fee_amount: Optional[float] = None
    penalty_fee_currency: Optional[str] = None
    relock_grace_days: Optional[int] = None


class CourseChapterCreate(BaseModel):
    tenant_name: str
    course_id: str
    module_id: str
    title: str = Field(..., min_length=1)
    position: int = Field(..., ge=1)
    content_type: str = "lesson"
    summary: str = ""
    estimated_minutes: int = 20
    mandatory: bool = True
    question_prompt: str = ""
    # Video URL for content_type in {"video", "guest_speaker"}.
    # Currently expects a YouTube URL (unlisted videos work — they're
    # embeddable but not discoverable). Empty string means the chapter
    # is a video chapter awaiting upload — the LMS will show a polite
    # "video coming soon" placeholder until faculty fills the URL.
    video_url: str = ""
    # 4-level hierarchy (Path B): a chapter belongs to a Lesson within
    # a Module. lesson_id optional for backwards compat — if missing,
    # the server auto-finds-or-creates a default "Main" lesson per
    # module and links the chapter there. New imports should set
    # lesson_id explicitly to organise content into named lessons.
    lesson_id: Optional[str] = None


class CourseLessonCreate(BaseModel):
    """4-level content hierarchy: Course → Module → Lesson → Chapter.

    Lessons group chapters within a module. Useful when a single
    week splits into multiple sub-topics, each with their own
    explainer + video + assignment chapters."""
    tenant_name: str
    course_id: str
    module_id: str
    title: str = Field(..., min_length=1)
    position: int = Field(..., ge=1)
    summary: str = ""
    estimated_minutes: int = 30


class CourseLessonUpdate(BaseModel):
    tenant_name: str
    title: Optional[str] = Field(default=None, min_length=1)
    position: Optional[int] = None
    summary: Optional[str] = None
    estimated_minutes: Optional[int] = None


class CourseChapterUpdate(BaseModel):
    """Patch a course chapter. All fields optional — only what's
    sent gets updated. Used by /course-chapters/{id}/secure to let
    admins set video_url, edit titles, etc. without touching the
    curriculum JSON file."""
    tenant_name: str
    title: Optional[str] = Field(default=None, min_length=1)
    position: Optional[int] = None
    content_type: Optional[str] = None
    summary: Optional[str] = None
    estimated_minutes: Optional[int] = None
    mandatory: Optional[bool] = None
    question_prompt: Optional[str] = None
    video_url: Optional[str] = None


class LearnerProgressUpdate(BaseModel):
    tenant_name: str
    application_id: str
    course_id: str
    module_id: Optional[str] = None
    chapter_id: Optional[str] = None
    status: Optional[str] = None
    chapter_status: Optional[str] = None
    module_status: Optional[str] = None
    current_week: Optional[int] = None
    unlock_override: Optional[bool] = None
    penalty_status: Optional[str] = None
    penalty_fee_amount: Optional[float] = None
    penalty_fee_currency: Optional[str] = None
    note: Optional[str] = None


class ChapterSubmissionCreate(BaseModel):
    tenant_name: str
    application_id: str
    course_id: str
    module_id: str
    chapter_id: str
    answer_text: str = ""
    answer_url: Optional[str] = None
    submission_kind: str = "text"


class TrainerReviewCreate(BaseModel):
    tenant_name: str
    submission_id: str
    reviewer_name: str
    outcome: str
    score: Optional[float] = None
    ai_feedback: str = ""
    trainer_feedback: str = ""
    unlock_next_module: bool = False


# -------------------------------------------------------------------
# Online certification test — V2 phase 2 sub-task D.
# Auto-graded test attached to a course. Y/N or multi-choice
# questions, percentage-based pass score (default 75 from curriculum
# Course.docx), N-day retake window (default 14 from curriculum).
# Storage: tenant_state JSON arrays — `tests`, `test_questions`,
# `test_attempts` — same blob pattern as applications.
# -------------------------------------------------------------------


class TestCreate(BaseModel):
    tenant_name: str
    course_id: str
    pass_score: int = 75
    retake_days: int = 14
    time_limit_minutes: Optional[int] = None
    active: bool = True


class TestQuestionCreate(BaseModel):
    tenant_name: str
    test_id: str
    prompt: str = Field(..., min_length=1)
    # "true_false" → correct_answer must be "true" or "false"
    # "multiple_choice" → options is a list of choices, correct_answer
    #   is the exact text of the correct option
    type: str = "true_false"
    options: list[str] = []
    correct_answer: str = Field(..., min_length=1)
    points: int = 1
    position: int = 1


class TestQuestionUpdate(BaseModel):
    tenant_name: str
    prompt: Optional[str] = Field(default=None, min_length=1)
    type: Optional[str] = None
    options: Optional[list[str]] = None
    correct_answer: Optional[str] = Field(default=None, min_length=1)
    points: Optional[int] = None
    position: Optional[int] = None


class TestAnswerSubmit(BaseModel):
    question_id: str
    given_answer: str = ""


class TestAttemptSubmit(BaseModel):
    tenant_name: str
    application_id: str
    answers: list[TestAnswerSubmit] = []


class CertificateIssueRequest(BaseModel):
    """Admin: manually issue a certificate. Used for waivers, manual
    grading, or backfilling certs for cohorts that completed before
    the auto-issue path was live. The webhook auto-issues on test
    pass — this endpoint is the manual override."""
    tenant_name: str
    application_id: str
    course_id: Optional[str] = None
    attempt_id: Optional[str] = None
    notes: str = ""


class CertificateRevokeRequest(BaseModel):
    tenant_name: str
    reason: str = ""
