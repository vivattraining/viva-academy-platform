import { SiteShell } from "../../components/site-shell";
import { StudentLoginPanel } from "../../components/student-login-panel";
import { CurrentSessionPanel } from "../../components/current-session-panel";

export default function LoginPage() {
  return (
    <SiteShell
      activeHref="/login"
      eyebrow="Student Access"
      title="Open the learner portal once your enrollment is activated."
      description="Student login is shared after payment and enrollment activation. Team members should use the separate internal login route."
    >
      <CurrentSessionPanel />
      <section className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Before you sign in</div>
        <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
          Student access is enabled only after the admissions team activates your account.
        </h2>
        <p className="editorial-workbench-subtitle">
          If you have already paid and have not received your student login yet, contact the admissions team for activation. Internal team members should use <strong>/internal/login</strong>.
        </p>
      </section>
      <section className="editorial-workbench-grid" style={{ marginTop: 24 }}>
        <StudentLoginPanel />
      </section>
    </SiteShell>
  );
}
