import { MarketingShell } from "../../components/marketing-shell";
import styles from "../../components/claude-home.module.css";
import { VIVA_12_MODULES } from "../../lib/public-site-content";

export default function CurriculumPage() {
  return (
    <MarketingShell activeHref="/curriculum">
      <section className={styles.curriculum}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 04 — Curriculum</div>
            <h1 className={styles.sectionTitle}>Twelve modules. Weekly progression. <em>No</em> skipping discipline.</h1>
          </div>
          <div className={styles.modules}>
            {VIVA_12_MODULES.map((item, index) => (
              <div key={item.week} className={styles.module}>
                <div className={styles.moduleCode}>{item.week}</div>
                <div className={styles.moduleTitle}>{item.title}</div>
                <div className={styles.moduleDuration}>{item.locked ? "Locked" : "Unlocked"}</div>
                <div className={styles.moduleMeta}>
                  2 questions · Trainer pass/fail · {index < 2 ? "Current progression window" : "Unlocks after previous completion"}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.pillarList} style={{ marginTop: 28 }}>
            <div className={styles.pillar}><div className={styles.roman}>i</div><div><h4>Unlock rules</h4><p>Modules unlock weekly. All chapters must be completed before the next module opens.</p></div></div>
            <div className={styles.pillar}><div className={styles.roman}>ii</div><div><h4>Penalty rules</h4><p>If a learner misses the 7-day window, the module locks and requires a ₹2000 payment to reopen for 2 days.</p></div></div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
