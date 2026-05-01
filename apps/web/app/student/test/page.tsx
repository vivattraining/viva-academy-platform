import { StudentTestRunner } from "../../../components/student-test-runner";

// Student-facing certification test runner.
//
// URL: /student/test?course_id=<id>&application_id=<id>
//
// The student LMS dashboard links here once the cohort reaches week 15
// (or any time after, if retake is needed). The runner enforces the
// retake window server-side — this page is just a thin wrapper around
// the runner component.
type SearchParams = {
  course_id?: string;
  application_id?: string;
};

export default function StudentTestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="editorial-page">
      <StudentTestRunner
        courseId={searchParams.course_id || ""}
        applicationId={searchParams.application_id || ""}
      />
    </main>
  );
}
