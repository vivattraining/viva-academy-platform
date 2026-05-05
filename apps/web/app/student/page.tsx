import { InternalRouteGate } from "../../components/internal-route-gate";
import { SiteShell } from "../../components/site-shell";
import { StudentHomeWorkspace } from "../../components/student-home-workspace";
import { requirePaidStudentAccess } from "../../lib/internal-access";

/**
 * Student home dashboard (per gap analysis §7.1).
 *
 * /student        → StudentHomeWorkspace (this page) — six-tile home
 *                   that surfaces progress, next live session, latest
 *                   feedback, attendance %, fee status, and certificate
 *                   readiness at a glance.
 * /dashboard      → StudentWorkspace (unchanged) — the deeper learner
 *                   shell with chapter rows, course progression, and
 *                   recent updates. Linked from each tile's "Open …"
 *                   action so learners can drill in from the home view.
 *
 * Three layers of protection (unchanged from the previous page):
 *   1. requirePaidStudentAccess() — server-side gate that verifies auth,
 *      role === "student", AND that the linked application has
 *      payment_stage === "paid". Anonymous, non-student, and unpaid
 *      students never see the shell at all.
 *   2. InternalRouteGate — client-side secondary gate for the post-
 *      hydration window.
 *   3. API layer — every endpoint the home workspace calls is auth-bound
 *      to the authenticated session, so a student only ever sees their
 *      own enrolled course content (cross-course isolation).
 */
export default async function StudentPage() {
  await requirePaidStudentAccess();

  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Student home"
      title="Your week at a glance — progress, live classes, feedback, and certification."
      description="A single home view for everything the cohort needs to keep moving: this week's progress, the next live class, latest trainer feedback, attendance, fees, and certificate readiness."
      navVariant="student"
    >
      <InternalRouteGate allowedRoles={["student"]}>
        <StudentHomeWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
