import { SiteShell } from "../../components/site-shell";
import { ACADEMY_STRATEGY_OPTIONS } from "../../lib/academy";

export default function StrategyPage() {
  return (
    <SiteShell
      activeHref="/strategy"
      eyebrow="Product strategy"
      title="Separate repo now is the right product decision if this is meant to become a serious white-label academy platform."
      description="This route captures the architecture stance behind the repo split: product independence now, shared-service integration only where it creates leverage."
      primaryCta={{ label: "Open white-label controls", href: "/white-label" }}
      secondaryCta={{ label: "Return to overview", href: "/" }}
    >
      <section className="grid grid-2">
        {ACADEMY_STRATEGY_OPTIONS.map((item) => (
          <article key={item.name} className="card">
            <div className="eyebrow">{item.name}</div>
            <div style={{ marginTop: 12, fontSize: 26, fontWeight: 900, letterSpacing: "-0.05em" }}>{item.verdict}</div>
            <div className="stack" style={{ marginTop: 18 }}>
              {item.pros.map((pro) => (
                <div key={pro} className="panel" style={{ background: "#ECFDF3" }}>
                  <p className="muted">{pro}</p>
                </div>
              ))}
              {item.cons.map((con) => (
                <div key={con} className="panel" style={{ background: "#FEF2F2" }}>
                  <p className="muted">{con}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
