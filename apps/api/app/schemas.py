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
    zoom_host_email: str = "faculty@vivacareeracademy.com"
    zoom_default_timezone: str = "Asia/Kolkata"


class ApplicationCreate(BaseModel):
    tenant_name: str
    student_name: str
    student_email: str
    student_phone: str = ""
    course_name: str
    source: str = "website"
    notes: str = ""
    amount_due: float = 0
    currency: str = "INR"


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
