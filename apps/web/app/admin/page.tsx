import { SiteShell } from "../../components/site-shell";
import { AdminBrandingStudio } from "../../components/admin-branding-studio";
import { AdminLmsConsole } from "../../components/admin-lms-console";
import { OperatorGate } from "../../components/operator-gate";
import { INTERNAL_ADMIN } from "../../lib/public-site-content";

export default function AdminPage() {
  return (
    <SiteShell
      activeHref="/admin"
      eyebrow="Academy CMS and operations"
      title="This is the control tower for curriculum, classrooms, attendance, certifications, and launch control."
      description="The admin surface is now being brought into the same editorial premium system while preserving the new LMS and branding controls underneath."
      primaryCta={{ label: "Open white-label controls", href: "/white-label" }}
      secondaryCta={{ label: "Open operations", href: "/operations" }}
    >
      <section className="grid grid-2">
        {INTERNAL_ADMIN.metrics.map((item) => (
          <article key={item.label} className="card">
            <div className="eyebrow">{item.label}</div>
            <div className="metric" style={{ marginTop: 12 }}>{item.value}</div>
          </article>
        ))}
      </section>

      <section className="grid grid-2" style={{ marginTop: 24 }}>
        {INTERNAL_ADMIN.actions.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Admin area</div>
            <p className="muted" style={{ marginTop: 12 }}>{item}</p>
          </article>
        ))}
      </section>

      <OperatorGate title="Admin branding and tenant controls" allowedRoles={["admin"]}>
        <AdminLmsConsole />
        <AdminBrandingStudio />
      </OperatorGate>
    </SiteShell>
  );
}
