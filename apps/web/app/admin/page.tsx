import { SiteShell } from "../../components/site-shell";
import { AdminBrandingStudio } from "../../components/admin-branding-studio";
import { AdminLaunchReadiness } from "../../components/admin-launch-readiness";
import { AdminLmsConsole } from "../../components/admin-lms-console";
import { AdminUserManagement } from "../../components/admin-user-management";
import { InternalRouteGate } from "../../components/internal-route-gate";
import { requireInternalPageAccess } from "../../lib/internal-access";
import { INTERNAL_ADMIN } from "../../lib/public-site-content";

export default async function AdminPage() {
  await requireInternalPageAccess(["admin"]);

  return (
    <SiteShell
      activeHref="/admin"
      eyebrow="Academy CMS and operations"
      title="This is the control tower for curriculum, classrooms, attendance, certifications, and launch control."
      description="The admin surface is now being brought into the same editorial premium system while preserving the new LMS and branding controls underneath."
      primaryCta={{ label: "Open messaging center", href: "/messages" }}
      secondaryCta={{ label: "Open operations", href: "/operations" }}
    >
      <InternalRouteGate allowedRoles={["admin"]}>
      <section className="split">
        <article className="editorial-workbench-card editorial-workbench-contrast">
          <div className="eyebrow">Control tower</div>
          <h2 className="editorial-workbench-title" style={{ marginTop: 14, fontSize: "2.35rem" }}>
            The academy control layer now matches the public site’s editorial tone.
          </h2>
          <p className="editorial-workbench-subtitle">
            Curriculum controls, classroom operations, branding, and LMS creation now sit inside the same premium interface language.
          </p>
        </article>
      </section>

      <section className="editorial-workbench-grid compact">
        {INTERNAL_ADMIN.metrics.map((item) => (
          <article key={item.label} className="editorial-workbench-card">
            <div className="eyebrow">{item.label}</div>
            <div className="metric" style={{ marginTop: 12 }}>{item.value}</div>
          </article>
        ))}
      </section>

      <section className="editorial-workbench-grid" style={{ marginTop: 24 }}>
        {INTERNAL_ADMIN.actions.map((item) => (
          <article key={item} className="editorial-workbench-card">
            <div className="eyebrow">Admin area</div>
            <p className="muted" style={{ marginTop: 12 }}>{item}</p>
          </article>
        ))}
      </section>

        <AdminLaunchReadiness />
        <AdminUserManagement />
        <AdminLmsConsole />
        <AdminBrandingStudio />
      </InternalRouteGate>
    </SiteShell>
  );
}
