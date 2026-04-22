import { ModuleSubmissionWorkspace } from "../../../../components/module-submission-workspace";
import { SiteShell } from "../../../../components/site-shell";

export default function DashboardModulePage({ params }: { params: { id: string } }) {
  return (
    <SiteShell
      activeHref="/student"
      eyebrow="Module workspace"
      title={`Module ${params.id} review and submission`}
      description="This is the dedicated module view for chapter status, answer submission, trainer evaluation, and AI help."
      primaryCta={{ label: "Submit answers", href: "/dashboard" }}
      secondaryCta={{ label: "Back to dashboard", href: "/dashboard" }}
    >
      <ModuleSubmissionWorkspace moduleId={params.id} />
    </SiteShell>
  );
}
