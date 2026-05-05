import { InternalRouteGate } from "../../../components/internal-route-gate";
import { SiteShell } from "../../../components/site-shell";
import { StudentCalendarWorkspace } from "../../../components/student-calendar-workspace";
import { requirePaidStudentAccess } from "../../../lib/internal-access";

/**
 * Student calendar (per gap analysis §7.3).
 *
 * /student/calendar → StudentCalendarWorkspace — chronological list of
 * every live session for the student's batch, grouped by month, with
 * date / time / trainer / mode / join button. The next-up session is
 * highlighted at the top with a live countdown.
 *
 * Same three layers of protection as /student:
 *   1. requirePaidStudentAccess() — server-side gate.
 *   2. InternalRouteGate — client-side secondary gate.
 *   3. API layer — students/me is auth-bound to the session.
 */
export default async function StudentCalendarPage() {
  await requirePaidStudentAccess();

  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Live calendar"
      title="Every live session for your cohort, in one place."
      description="Date, time, trainer, mode, and a join link for every scheduled live class. The next session up is pinned at the top with a countdown so you never miss it."
      navVariant="student"
    >
      <InternalRouteGate allowedRoles={["student"]}>
        <StudentCalendarWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
