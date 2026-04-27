import { InternalRouteGate } from "../../components/internal-route-gate";
import { SiteShell } from "../../components/site-shell";
import { StudentWorkspace } from "../../components/student-workspace";
import { requirePaidStudentAccess } from "../../lib/internal-access";

/**
 * Student workspace page.
 *
 * Three layers of protection:
 *   1. requirePaidStudentAccess() — server-side gate that verifies auth,
 *      role === "student", AND that the linked application has
 *      payment_stage === "paid". Anonymous, non-student, and unpaid
 *      students never see the shell at all.
 *   2. InternalRouteGate — client-side secondary gate for the post-
 *      hydration window.
 *   3. API layer — every endpoint StudentWorkspace calls is auth-bound to
 *      the authenticated session, so a student only ever sees their own
 *      enrolled course content (cross-course isolation).
 */
export default async function StudentPage() {
  await requirePaidStudentAccess();

  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Student dashboard"
      title="Track progress, live classes, deadlines, and certification readiness."
      description="The learner experience now reflects batch state, attendance progression, and upcoming live interaction in a more polished dashboard view."
      navVariant="student"
    >
      <InternalRouteGate allowedRoles={["student"]}>
        <StudentWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
