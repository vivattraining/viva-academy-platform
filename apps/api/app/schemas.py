from typing import Optional

from pydantic import BaseModel, Field


class TenantBranding(BaseModel):
    tenant_name: str = Field(..., min_length=1)
    brand_name: str = Field(..., min_length=1)
    academy_name: str = Field(..., min_length=1)
    custom_domain: str = Field(..., min_length=1)
    primary_color: str = "#0B1F3A"
    accent_color: str = "#F4B400"
    support_email: str = "support@vivatraininginstitute.com"
    certificate_name: str = "VIVA Certified Travel Professional"
    classroom_provider: str = "zoom"
    zoom_host_email: str = "faculty@vivatraininginstitute.com"
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
