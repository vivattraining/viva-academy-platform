import { SiteShell } from "../../components/site-shell";
import { ACADEMY_THEME, ACADEMY_WHITE_LABEL_CONTROLS } from "../../lib/academy";

export default function WhiteLabelPage() {
  return (
    <SiteShell
      activeHref="/white-label"
      eyebrow="White-label controls"
      title="Every institute should run on its own domain, with its own brand system and certificates."
      description="Viva Career Academy is the first tenant, but the platform should be designed so future academy brands can configure domain, faculty, classroom defaults, and certification identity without product rewrites."
      primaryCta={{ label: "Open admin CMS", href: "/admin" }}
      secondaryCta={{ label: "Open strategy", href: "/strategy" }}
    >
      <section className="grid grid-2">
        <article className="card" style={{ background: ACADEMY_THEME.primary, color: "white" }}>
          <div className="eyebrow" style={{ color: "#F4D77B" }}>VIVA first tenant</div>
          <div style={{ marginTop: 14, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>www.vivacareeracademy.com</div>
          <p style={{ marginTop: 12, color: "#D7E4F6", lineHeight: 1.7 }}>
            Students should see VIVA branding, VIVA messaging, and VIVA certificates. Platform identity should stay behind the scenes unless you intentionally expose it.
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Control set</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {ACADEMY_WHITE_LABEL_CONTROLS.map((item) => (
              <div key={item} className="panel" style={{ background: "#F2F4F6" }}>
                <p className="muted">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
