"""
v2 — proper relational schema for Course/Module/Lesson/Assignment/Submission.

This module is loaded but NOT yet wired into the routers. It exists so the
DB tables get created (via SQLAlchemy create_all) on the next API deploy,
which is the prerequisite for the v2 LMS features. The handlers in
routers/v2_courses.py read/write these tables.

Master Build alignment:
  Course.level         — "foundation" | "pro" | "elite" | "specialisation"
  Course.is_specialisation — top-level filter for /courses listing
  Course.published_state — "draft" | "coming_soon" | "open" | "live"
  Course.tiers (JSON)  — multi-tier pricing list, e.g.
                         [{name: "Standard", price: 40000, currency: "INR"}]

Course → Module → Lesson is the canonical hierarchy.
Lesson → Assignment is 1:1 (most lessons have an assignment).
Assignment → Submission (per-learner) → optional TrainerReview.
Course → Certificate (issued per-learner once they pass).

Why these tables and not the existing JSON-blob `course_modules` /
`course_chapters`? Because:
  - Real foreign keys + indexes for fast course-listing queries
  - Per-row authorisation (a trainer can only see their courses)
  - Migration to multi-tenant white-label is a one-line filter add
  - The JSON blob still works for current data; v2 tables coexist until
    we migrate the live tenant in a controlled cutover.
"""

from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)

from app.db import Base


# ---------- Course ----------------------------------------------------------


class V2Course(Base):
    """A top-level course/programme. Maps 1:1 to a card on /courses."""

    __tablename__ = "v2_courses"
    __table_args__ = (
        UniqueConstraint("tenant_name", "slug", name="uq_v2_course_slug"),
        Index("ix_v2_courses_level", "tenant_name", "level"),
        Index("ix_v2_courses_published", "tenant_name", "published_state"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)

    # Identity
    code = Column(String, nullable=False)  # e.g. "C001"
    slug = Column(String, nullable=False)  # e.g. "travel-career-accelerator"
    name = Column(String, nullable=False)
    tagline = Column(String, nullable=True)
    short_description = Column(Text, nullable=True)
    long_description = Column(Text, nullable=True)

    # Master Build classification
    level = Column(String, nullable=False, default="foundation")
    # "foundation" | "pro" | "elite" | "specialisation"
    is_specialisation = Column(Boolean, nullable=False, default=False)
    category = Column(String, nullable=True)  # "Core" | "Operations" | "Service" | …
    duration_label = Column(String, nullable=True)  # "16 weeks", "8 weeks"
    duration_weeks = Column(Integer, nullable=True)

    # Lifecycle
    published_state = Column(String, nullable=False, default="draft")
    # "draft" | "coming_soon" | "open" | "live" | "archived"
    target_launch_month = Column(String, nullable=True)  # "2026-09" e.g.
    cohort_start_date = Column(String, nullable=True)
    cohort_end_date = Column(String, nullable=True)
    application_deadline = Column(String, nullable=True)
    cohort_size = Column(Integer, nullable=True)
    schedule = Column(String, nullable=True)
    format = Column(String, nullable=True)  # "Hybrid", "Live", "Studio"

    # Pricing — multi-tier as JSON list
    tiers = Column(JSON, nullable=True)
    # [{ "name": "Standard", "price": 40000, "currency": "INR", "description": null }]

    # Marketing surface
    hero_image = Column(String, nullable=True)
    lead_trainer_name = Column(String, nullable=True)
    lead_trainer_bio = Column(Text, nullable=True)
    lead_trainer_image = Column(String, nullable=True)
    outcomes = Column(JSON, nullable=True)  # ["You will learn …", …]
    careers = Column(JSON, nullable=True)  # ["Travel consultant", …]
    recruiters = Column(JSON, nullable=True)  # [{ label, body }]
    faqs = Column(JSON, nullable=True)  # [{ q, a }]

    # Audit
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


# ---------- Module ----------------------------------------------------------


class V2Module(Base):
    """A teaching unit inside a course (typically one per week)."""

    __tablename__ = "v2_modules"
    __table_args__ = (
        Index("ix_v2_modules_course", "tenant_name", "course_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    course_id = Column(Integer, nullable=False)
    code = Column(String, nullable=False)  # "M01"
    title = Column(String, nullable=False)
    week_number = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)
    duration_hours = Column(Integer, nullable=True)
    position = Column(Integer, nullable=False, default=0)

    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


# ---------- Lesson ----------------------------------------------------------


class V2Lesson(Base):
    """A single lesson the student plays / reads / does."""

    __tablename__ = "v2_lessons"
    __table_args__ = (
        Index("ix_v2_lessons_module", "tenant_name", "module_id"),
        Index("ix_v2_lessons_course", "tenant_name", "course_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    course_id = Column(Integer, nullable=False)
    module_id = Column(Integer, nullable=False)

    code = Column(String, nullable=False)  # "L001"
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)

    format = Column(String, nullable=False, default="recorded")
    # "live" | "recorded" | "reading" | "workshop" | "simulation"
    duration_minutes = Column(Integer, nullable=True)
    video_url = Column(String, nullable=True)
    reading_url = Column(String, nullable=True)

    learning_outcome = Column(Text, nullable=True)
    trainer_notes = Column(Text, nullable=True)

    position = Column(Integer, nullable=False, default=0)
    mandatory = Column(Boolean, nullable=False, default=True)

    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


# ---------- Assignment ------------------------------------------------------


class V2Assignment(Base):
    """An exercise tied to a lesson. Students submit; trainers review."""

    __tablename__ = "v2_assignments"
    __table_args__ = (
        Index("ix_v2_assignments_lesson", "tenant_name", "lesson_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    course_id = Column(Integer, nullable=False)
    lesson_id = Column(Integer, nullable=False)

    title = Column(String, nullable=False)
    instructions = Column(Text, nullable=True)
    pass_criteria = Column(Text, nullable=True)
    max_score = Column(Integer, nullable=False, default=100)
    pass_threshold = Column(Integer, nullable=False, default=70)
    due_offset_days = Column(Integer, nullable=True)

    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


# ---------- Submission ------------------------------------------------------


class V2Submission(Base):
    """One learner's submission to one assignment."""

    __tablename__ = "v2_submissions"
    __table_args__ = (
        UniqueConstraint(
            "tenant_name",
            "assignment_id",
            "student_email",
            name="uq_v2_submission",
        ),
        Index("ix_v2_submissions_student", "tenant_name", "student_email"),
        Index("ix_v2_submissions_status", "tenant_name", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    assignment_id = Column(Integer, nullable=False)
    course_id = Column(Integer, nullable=False)
    lesson_id = Column(Integer, nullable=False)
    student_email = Column(String, nullable=False)
    student_name = Column(String, nullable=True)

    body = Column(Text, nullable=True)  # text submission
    attachment_url = Column(String, nullable=True)
    submitted_at = Column(String, nullable=True)

    status = Column(String, nullable=False, default="submitted")
    # "submitted" | "passed" | "resubmit" | "failed"
    score = Column(Integer, nullable=True)
    trainer_feedback = Column(Text, nullable=True)
    reviewer_email = Column(String, nullable=True)  # bound to session, never client-supplied
    reviewer_name = Column(String, nullable=True)
    reviewed_at = Column(String, nullable=True)

    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


# ---------- Certificate ----------------------------------------------------


class V2Certificate(Base):
    """A certificate issued to a learner upon course completion."""

    __tablename__ = "v2_certificates"
    __table_args__ = (
        UniqueConstraint(
            "tenant_name",
            "course_id",
            "student_email",
            name="uq_v2_certificate",
        ),
        Index("ix_v2_certificates_student", "tenant_name", "student_email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    course_id = Column(Integer, nullable=False)
    student_email = Column(String, nullable=False)
    student_name = Column(String, nullable=False)
    course_name = Column(String, nullable=False)

    serial_number = Column(String, nullable=False, unique=True)
    issued_at = Column(String, nullable=False)
    valid_until = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    issuer = Column(String, nullable=False, default="Viva Career Academy")

    # Verification token used in the public verify URL — opaque, unguessable.
    verification_token = Column(String, nullable=False, unique=True)

    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)
