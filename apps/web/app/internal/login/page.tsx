import { AdminBootstrapPanel } from "../../../components/admin-bootstrap-panel";
import { SiteShell } from "../../../components/site-shell";
import { OperatorGate } from "../../../components/operator-gate";
import styles from "../../../components/claude-home.module.css";
import { CurrentSessionPanel } from "../../../components/current-session-panel";

export default function InternalLoginPage() {
  return (
    <SiteShell
      activeHref="/internal/login"
      eyebrow="Internal Access"
      title="Secure sign-in for Viva Career Academy operators, trainers, and admin."
      description="This route is reserved for the internal team managing admissions, curriculum, classrooms, and academy operations."
    >
      <CurrentSessionPanel />
      <AdminBootstrapPanel />
      <section className="editorial-workbench-card editorial-workbench-contrast">
        <div className="eyebrow">Internal route</div>
        <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
          Use this internal login for operations, trainers, and admin only.
        </h2>
        <p className="editorial-workbench-subtitle">
          Student access is intentionally handled separately so the public site stays clean and the team has a dedicated operational entry point.
        </p>
      </section>
      <section className={styles.programGrid}>
        <OperatorGate title="Open operator workspace" allowedRoles={["admin", "operations", "trainer"]}>
          <section className="card">Signed in. Use the navigation to open admissions, operations, messaging, trainer, and admin surfaces.</section>
        </OperatorGate>
      </section>
    </SiteShell>
  );
}
