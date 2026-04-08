import { SiteShell } from "../../components/site-shell";
import { AdminBrandingStudio } from "../../components/admin-branding-studio";
import { OperatorGate } from "../../components/operator-gate";
import { ACADEMY_ADMIN_METRICS, ACADEMY_OPERATIONS_STACK } from "../../lib/academy";

export default function AdminPage() {
  return (
    <SiteShell
      activeHref="/admin"
      eyebrow="Academy CMS and operations"
      title="This is the control tower for curriculum, classrooms, attendance, certifications, and white-label setup."
      description="This page is where VIVA and future institutes manage content, live delivery settings, Zoom defaults, payments, certificates, and custom-domain branding."
      primaryCta={{ label: "Open white-label controls", href: "/white-label" }}
      secondaryCta={{ label: "Open operations", href: "/operations" }}
    >
      <section className="grid grid-2">
        {ACADEMY_ADMIN_METRICS.map((item) => (
          <article key={item.label} className="card">
            <div className="eyebrow">{item.label}</div>
            <div className="metric" style={{ marginTop: 12 }}>{item.value}</div>
          </article>
        ))}
      </section>

      <section className="grid grid-2" style={{ marginTop: 24 }}>
        {ACADEMY_OPERATIONS_STACK.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Admin area</div>
            <p className="muted" style={{ marginTop: 12 }}>{item}</p>
          </article>
        ))}
      </section>

      <OperatorGate title="Admin branding and tenant controls" allowedRoles={["admin"]}>
        <AdminBrandingStudio />
      </OperatorGate>
    </SiteShell>
  );
}
