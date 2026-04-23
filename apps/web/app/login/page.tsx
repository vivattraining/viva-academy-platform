import { AdminBootstrapPanel } from "../../components/admin-bootstrap-panel";
import { SiteShell } from "../../components/site-shell";
import { OperatorGate } from "../../components/operator-gate";
import { StudentLoginPanel } from "../../components/student-login-panel";
import styles from "../../components/claude-home.module.css";

export default function LoginPage() {
  return (
    <SiteShell
      activeHref="/login"
      eyebrow="Access"
      title="Choose the right VIVA entry point for operators and learners."
      description="Staff can open the secure operating surfaces here, while students can move directly into the learner dashboard with their own account."
    >
      <AdminBootstrapPanel />
      <section className={styles.programGrid}>
        <StudentLoginPanel />
        <OperatorGate title="Open operator workspace" allowedRoles={["admin", "operations", "trainer"]}>
          <section className="card">Signed in. Use the navigation to open admissions, operations, messaging, and admin surfaces.</section>
        </OperatorGate>
      </section>
    </SiteShell>
  );
}
