import { MarketingShell } from "../../components/marketing-shell";
import { PUBLIC_HOW_IT_WORKS, PUBLIC_MONTHS } from "../../lib/public-site-content";

export default function CurriculumPage() {
  return (
    <MarketingShell
      activeHref="/curriculum"
    >
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <h1 className="editorial-page-title">Course Curriculum</h1>
          <p className="editorial-section-copy">
            A disciplined 12-week roadmap designed for professional mastery. Follow the linear progression from foundational theory to advanced institutional practice.
          </p>
        </div>
      </section>

      <section className="curriculum-layout">
        <aside className="curriculum-rail">
          <div className="rail-node active">01</div>
          <div className="rail-line active" />
          <div className="rail-node">06</div>
          <div className="rail-line" />
          <div className="rail-node locked">🔒</div>
        </aside>

        <div className="curriculum-content">
          <section className="curriculum-module active">
            <div className="curriculum-module-label">Week 01</div>
            <div className="curriculum-module-card active">
              <div className="curriculum-module-top">
                <div>
                  <h2>Module 1: Institutional Foundations</h2>
                  <p>Introduction to core pedagogical frameworks and the historical context of travel, tourism, and training standards.</p>
                </div>
                <div className="curriculum-progress-box">
                  <span>Current Progress</span>
                  <strong>75%</strong>
                  <div className="curriculum-progress-bar"><div /></div>
                </div>
              </div>
              <div className="curriculum-chapters">
                {PUBLIC_MONTHS[0].items.slice(0, 2).map((item) => (
                  <div key={item} className="curriculum-chapter active">{item}</div>
                ))}
              </div>
            </div>
          </section>

          <section className="curriculum-module">
            <div className="curriculum-module-label muted">Week 02</div>
            <div className="curriculum-module-card">
              <h2>Module 2: Advanced Behavioral Analysis</h2>
              <p>Deciphering learner psychology, customer handling, and operational discipline in high-intensity training environments.</p>
              <div className="curriculum-chapters">
                {PUBLIC_MONTHS[1].items.slice(0, 3).map((item) => (
                  <div key={item} className="curriculum-chapter">{item}</div>
                ))}
              </div>
            </div>
          </section>

          <section className="curriculum-module locked">
            <div className="curriculum-module-label muted">Week 03-12</div>
            <div className="curriculum-module-card locked">
              <h3>Modules 3 through 12</h3>
              <p>Unlocks when previous completed.</p>
              <div className="curriculum-chip-grid">
                {Array.from({ length: 10 }, (_, index) => (
                  <span key={index}>Week {String(index + 3).padStart(2, "0")}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="curriculum-faculty-quote">
            <div className="curriculum-avatar" />
            <div>
              <span className="editorial-kicker">Module Lead</span>
              <h4>VIVA Faculty Leadership</h4>
              <p>
                The curriculum is designed not just to transmit information, but to develop professional intuition. We demand excellence because the industry requires it.
              </p>
            </div>
          </section>
        </div>
      </section>
    </MarketingShell>
  );
}
