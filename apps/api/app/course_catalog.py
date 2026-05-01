"""
Server-side course catalog — single source of truth for course-to-price
mapping.

Every payment goes through this catalog. The frontend may send a
`course_code` with an application; the API looks up the price HERE,
not from the client. The client cannot influence what Razorpay charges.

This intentionally mirrors `apps/web/lib/public-site-content.ts ::
LIVE_SITE_PROGRAMS` — both files must stay in sync until we migrate
courses to the v2 DB schema (apps/api/app/v2_models.py::V2Course),
at which point the catalog moves into the database and this module
becomes a thin DB-fetch.

If you change a price here, also change the corresponding entry in
public-site-content.ts so the homepage and the payment match.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Course:
    code: str  # e.g. "P · 01"
    name: str
    fee_inr: int  # plain rupees, e.g. 24999. Multiply by 100 for paise on Razorpay.
    duration_label: str
    cohort_label: str
    coming_soon: bool = False


# Mirrors apps/web/lib/public-site-content.ts::LIVE_SITE_PROGRAMS.
COURSE_CATALOG: tuple[Course, ...] = (
    Course(
        code="P · 01",
        name="Foundation Program in Travel & Tourism Industry",
        fee_inr=24999,
        duration_label="16 weeks",
        cohort_label="26 May 2026",
        coming_soon=False,
    ),
    Course(
        code="P · 02",
        name="Travel Career Accelerator Program",
        fee_inr=36999,
        duration_label="16 weeks",
        cohort_label="6 Jun 2026",
        coming_soon=False,
    ),
    Course(
        code="P · 03",
        name="Event & MICE Career Accelerator (Specialisation)",
        fee_inr=36999,
        duration_label="16 weeks",
        cohort_label="Aug 2026",
        coming_soon=True,
    ),
    Course(
        code="P · 04",
        name="Travel Operations & Tour Management Program",
        fee_inr=36999,
        duration_label="16 weeks",
        cohort_label="Aug 2026",
        coming_soon=True,
    ),
    Course(
        code="P · 05",
        name="Food & Beverage Service Professional Program",
        fee_inr=49999,
        duration_label="16 weeks",
        cohort_label="Aug 2026",
        coming_soon=True,
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
    """A coming-soon course should NOT accept payments yet."""
    return not course.coming_soon
