import { MarketingShell } from "../../components/marketing-shell";
import { VIVA_12_MODULES } from "../../lib/public-site-content";

export default function CurriculumPage() {
  return (
    <MarketingShell activeHref="/curriculum">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">12 modules. Weekly progression. No skipping discipline.</h1>
          <p className="editorial-section-copy">
            Each module unlocks weekly. Students must complete every chapter, submit answers, and pass trainer review before progressing. Miss the window and the module relocks with a ₹2000 late unlock fee.
          </p>
        </div>
      </section>

      <section className="editorial-grid editorial-grid-2">
        {VIVA_12_MODULES.map((item, index) => (
          <article key={item.week} className="editorial-accordion-card">
            <div className="editorial-accordion-head">
              <div>
                <span className="editorial-index">{item.week}</span>
                <h3>{item.title}</h3>
              </div>
              <span className={`editorial-chip${item.locked ? "" : " light"}`}>{item.locked ? "Locked" : "Unlocked"}</span>
            </div>
            <div className="editorial-accordion-body">
              <span>2 mandatory submission questions</span>
              <span>Trainer evaluation: Pass / Fail</span>
              <span>{index < 2 ? "Current progression window active" : "Unlocks only after previous module completion"}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="editorial-section editorial-tonal">
        <div className="editorial-grid editorial-grid-2">
          <article className="editorial-card">
            <h3>Unlock rules</h3>
            <p>Modules unlock weekly. All chapters must be completed before the next module opens.</p>
          </article>
          <article className="editorial-card">
            <h3>Penalty rules</h3>
            <p>If a learner misses the 7-day window, the module locks and requires a ₹2000 payment to reopen for 2 days.</p>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
