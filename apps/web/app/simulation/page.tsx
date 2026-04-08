import { SiteShell } from "../../components/site-shell";
import { ACADEMY_SIMULATION_SCENE } from "../../lib/academy";

export default function SimulationPage() {
  return (
    <SiteShell
      activeHref="/simulation"
      eyebrow="Simulation lab"
      title="Use scenario-based practice as the core teaching engine, not an optional add-on."
      description="Simulation is where the academy becomes outcome-driven. This page should evolve into the scored workspace for sales, operations, itinerary, and customer-experience drills."
      primaryCta={{ label: "Open student workspace", href: "/student" }}
      secondaryCta={{ label: "Open trainer studio", href: "/trainer" }}
    >
      <section className="grid grid-2">
        <article className="card">
          <div className="eyebrow">{ACADEMY_SIMULATION_SCENE.category}</div>
          <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>{ACADEMY_SIMULATION_SCENE.title}</div>
          <p className="muted" style={{ marginTop: 12 }}>{ACADEMY_SIMULATION_SCENE.brief}</p>
          <div className="panel" style={{ marginTop: 18, background: "#F2F4F6" }}>
            <div className="eyebrow">Learner draft</div>
            <p className="muted" style={{ marginTop: 12 }}>{ACADEMY_SIMULATION_SCENE.learnerDraft}</p>
          </div>
        </article>

        <article className="card">
          <div className="eyebrow">AI review</div>
          <div className="metric" style={{ marginTop: 12 }}>{ACADEMY_SIMULATION_SCENE.score}/100</div>
          <div className="stack" style={{ marginTop: 18 }}>
            {ACADEMY_SIMULATION_SCENE.focus.map((item) => (
              <div key={item} className="panel" style={{ background: "#F2F4F6" }}>
                <div className="eyebrow">{item}</div>
              </div>
            ))}
          </div>
          <div className="panel" style={{ marginTop: 18, background: "#F2F4F6" }}>
            <div className="eyebrow">Improved draft</div>
            <p className="muted" style={{ marginTop: 12 }}>{ACADEMY_SIMULATION_SCENE.improvedDraft}</p>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
