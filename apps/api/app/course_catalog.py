"""
Server-side course catalog — SINGLE SOURCE OF TRUTH for everything
about a course: name, price, cohort date, duration, marketing copy,
title splits, and reservation fee.

This file is the only place to edit course data. The frontend fetches
everything from /api/v1/academy/courses/catalog and never hardcodes
course content. To rename, reprice, reschedule, or rewrite a course's
description, edit ONE entry here and redeploy. The homepage cards,
the /courses page, the application dropdown, the price preview, the
Razorpay modal, and the receipt all update from this file alone.

Reservation fee (advance payment for coming-soon courses):
  - Live courses: reservation_fee_inr = 0 (full fee paid upfront)
  - Coming-soon courses: reservation_fee_inr = 5000
    Students pay ₹5,000 to reserve a seat; the balance is due within
    14 days of the cohort date being announced.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Course:
    # Structural / pricing
    code: str  # e.g. "P · 01"
    name: str  # full canonical title (e.g. "Foundation Program in Travel & Tourism Industry")
    fee_inr: int  # rupees, multiplied by 100 for paise on Razorpay
    duration_label: str  # e.g. "16 weeks"
    format_label: str  # e.g. "Hybrid"
    cohort_label: str  # e.g. "26 May 2026"
    coming_soon: bool = False
    reservation_fee_inr: int = 0  # 0 = no reservation flow; coming-soon courses set this to 5000

    # Display copy (homepage cards split the title across two lines for typography)
    title_lead: str = ""  # homepage card line 1 (regular weight)
    title_emphasis: str = ""  # homepage card line 2 (italic)
    description: str = ""  # marketing body shown on cards and in price preview


COURSE_CATALOG: tuple[Course, ...] = (
    Course(
        code="P · 01",
        name="Foundation Program in Travel & Tourism Industry",
        fee_inr=36999,
        duration_label="16 weeks",
        format_label="Hybrid",
        cohort_label="26 May 2026",
        coming_soon=False,
        reservation_fee_inr=0,
        title_lead="Foundation Program in",
        title_emphasis="Travel & Tourism Industry",
        description=(
            "The 16-week foundation programme. Sector orientation, customer journey, "
            "sales, operations, geography, MICE, costing, and business models — the "
            "disciplined first step into a real career in travel for committed beginners."
        ),
    ),
    Course(
        code="P · 02",
        name="Travel Career Accelerator Program",
        fee_inr=36999,
        duration_label="16 weeks",
        format_label="Hybrid",
        cohort_label="6 Jun 2026",
        coming_soon=False,
        reservation_fee_inr=0,
        title_lead="Travel Career",
        title_emphasis="Accelerator Program",
        description=(
            "Master the commercial side of travel. Build expertise in client acquisition, "
            "product positioning, pricing strategy, and relationship management. Learn how "
            "to plan, sell, and deliver experiences end-to-end — designed to prepare you for "
            "high-performance roles in travel sales and business development."
        ),
    ),
    Course(
        code="P · 03",
        name="Event & MICE Career Accelerator (Specialisation)",
        fee_inr=36999,
        duration_label="16 weeks",
        format_label="Hybrid",
        cohort_label="Aug 2026",
        coming_soon=True,
        reservation_fee_inr=5000,
        title_lead="Event & MICE",
        title_emphasis="Career Accelerator (Specialisation)",
        description=(
            "Step into the world of high-impact events. Corporate meetings, incentives, "
            "conferences, exhibitions, and destination weddings. Event conceptualisation, "
            "vendor coordination, budgeting, and on-ground execution — for those aiming to "
            "build careers in India's fastest-growing MICE and experiential events segment."
        ),
    ),
    Course(
        code="P · 04",
        name="Travel Operations & Tour Management Program",
        fee_inr=36999,
        duration_label="16 weeks",
        format_label="Hybrid",
        cohort_label="Aug 2026",
        coming_soon=True,
        reservation_fee_inr=5000,
        title_lead="Travel Operations &",
        title_emphasis="Tour Management",
        description=(
            "Operations-oriented programme. Itinerary design, GDS fundamentals, destination "
            "knowledge, vendor coordination, and end-to-end tour execution. Build the "
            "operational discipline behind seamless travel — for the people who run trips end-to-end."
        ),
    ),
    Course(
        code="P · 05",
        name="Food & Beverage Service Professional Program",
        fee_inr=49999,
        duration_label="16 weeks",
        format_label="Hybrid",
        cohort_label="Aug 2026",
        coming_soon=True,
        reservation_fee_inr=5000,
        title_lead="Food & Beverage",
        title_emphasis="Service Professional",
        description=(
            "Restaurant-floor mastery for hospitality careers. Front-of-house service, "
            "beverage knowledge, guest handling, and the operational rhythm of high-standard "
            "restaurants. Designed for learners stepping into hospitality and F&B service roles."
        ),
    ),
)


_BY_CODE: dict[str, Course] = {c.code: c for c in COURSE_CATALOG}
_BY_NAME: dict[str, Course] = {c.name.lower(): c for c in COURSE_CATALOG}


def find_course(*, code: Optional[str] = None, name: Optional[str] = None) -> Optional[Course]:
    """Look up a course by code (preferred) or by name (case-insensitive fallback)."""
    if code:
        course = _BY_CODE.get(code.strip())
        if course is not None:
            return course
    if name:
        return _BY_NAME.get(name.strip().lower())
    return None


def is_open_for_admissions(course: Course) -> bool:
    """A coming-soon course should NOT accept full-fee applications.

    Coming-soon courses CAN accept reservation payments (₹5,000 advance)
    via the reservation flow, but cannot be applied to as live courses.
    """
    return not course.coming_soon
