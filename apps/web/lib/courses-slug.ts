/**
 * URL slug helpers for the per-course detail pages at `/courses/[code]`.
 *
 * The catalog uses display codes like "P · 01" (with the editorial middot)
 * which is hostile to URLs. We map those to clean slugs:
 *
 *   "P · 01"  →  "p01"
 *   "P·02"    →  "p02"
 *   "p · 03"  →  "p03"
 *
 * The /courses/[code] page accepts EITHER the clean slug OR a URL-encoded
 * full code, so old shared links stay valid. New surfaces (sitemap, internal
 * links) should use the clean slug.
 */

import type { Course } from "./courses-data";

/** Lowercase, alphanumeric-only slug for use in URL segments. */
export function slugForCourse(course: Pick<Course, "code">): string {
  return course.code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Find a course in the catalog by either clean slug or display code. */
export function findCourseByCodeOrSlug(
  courses: Course[],
  param: string,
): Course | undefined {
  const decoded = decodeURIComponent(param || "").trim();
  if (!decoded) return undefined;
  const target = decoded.toLowerCase().replace(/[^a-z0-9]/g, "");
  return courses.find((course) => slugForCourse(course) === target);
}
