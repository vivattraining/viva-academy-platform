import { InternalRouteGate } from "../../../components/internal-route-gate";
import { SiteShell } from "../../../components/site-shell";
import { StudentTestRunner } from "../../../components/student-test-runner";
import { requirePaidStudentAccess } from "../../../lib/internal-access";

// Student-facing certification test runner.
//
// URL: /student/test?course_id=<id>&application_id=<id>
//
// The student LMS dashboard links here once the cohort reaches week 15
// (or any time after, if retake is needed). The runner enforces the
// retake window server-side — this page is the thin wrapper around
// the runner component.
//
// 18 May audit — H-NEW-1: previously this route had NO gate of any kind
// and returned 200 to anonymous visitors. All sibling student routes
// (/student, /student/calendar, /student/settings) apply the standard
// three-layer protection:
//   1. requirePaidStudentAccess() — server-side, runs in the request
//   2. InternalRouteGate — client-side secondary gate against forged cookies
//   3. API layer auth — the /tests endpoints are auth-bound to the session
// This route now matches the sibling contract.

type SearchParams = {
  course_id?: string;
  application_id?: string;
};

export default async function StudentTestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePaidStudentAccess();

  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Certification test"
      title="Take the final test."
      description="The certification test is auto-graded. Pass at 75% to receive your VIVA certificate; retake is permitted once after a 14-day window."
      navVariant="student"
    >
      <InternalRouteGate allowedRoles={["student"]}>
        <StudentTestRunner
          courseId={searchParams.course_id || ""}
          applicationId={searchParams.application_id || ""}
        />
      </InternalRouteGate>
    </SiteShell>
  );
}
