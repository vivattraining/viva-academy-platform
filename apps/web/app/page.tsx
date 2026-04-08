import { SiteShell } from "../components/site-shell";
import {
  ACADEMY_FEATURES,
  ACADEMY_METRICS,
  ACADEMY_PROGRAM_PILLARS,
  ACADEMY_PUBLIC_SECTIONS,
  ACADEMY_THEME
} from "../lib/academy";

export default function HomePage() {
  return (
    <SiteShell
      activeHref="/"
      eyebrow="AI-native training institute product"
      title="Build the VIVA-style online academy now, on VIVA's own domain, with white-label architecture from day one."
      description="This standalone repo is now the academy product surface: premium public landing, student learning loop, trainer studio, curriculum CMS, classroom operations, certification, and institute-owned domain white-labeling."
      primaryCta={{ label: "Start admissions journey", href: "/admissions" }}
      secondaryCta={{ label: "Open learner login", href: "/login" }}
    >
      <section className="grid grid-2">
        {ACADEMY_METRICS.map((item) => (
          <article key={item.label} className="card">
            <div className="eyebrow">{item.label}</div>
            <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>{item.value}</div>
          </article>
        ))}
      </section>

      <section className="grid grid-2" style={{ marginTop: 24 }}>
        {ACADEMY_FEATURES.map((item) => (
          <article key={item.title} className="card">
            <div className="eyebrow">{item.title}</div>
            <p className="muted" style={{ marginTop: 12 }}>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-2" style={{ marginTop: 24 }}>
        <article className="card" style={{ background: ACADEMY_THEME.primary, color: "white" }}>
          <div className="eyebrow" style={{ color: "#F4D77B" }}>Public site anatomy</div>
          <h2 style={{ marginTop: 14, fontSize: 34, lineHeight: 1.08, letterSpacing: "-0.05em" }}>
            A high-trust acquisition layer for students and parents, not a generic LMS homepage.
          </h2>
          <div className="stack" style={{ marginTop: 18 }}>
            {ACADEMY_PUBLIC_SECTIONS.map((item) => (
              <div key={item} style={{ borderRadius: 20, padding: 16, background: "rgba(255,255,255,0.08)" }}>
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="eyebrow">Core build pillars</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {ACADEMY_PROGRAM_PILLARS.map((item) => (
              <div key={item.title} className="panel" style={{ padding: 20, background: "#F2F4F6" }}>
                <div className="eyebrow">{item.title}</div>
                <p className="muted" style={{ marginTop: 12 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
