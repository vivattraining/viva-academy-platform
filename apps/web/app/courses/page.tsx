import { MarketingShell } from "../../components/marketing-shell";
import styles from "../../components/claude-home.module.css";
import {
  LIVE_SITE_PROGRAMS,
} from "../../lib/public-site-content";

export default function CoursesPage() {
  return (
    <MarketingShell activeHref="/courses">
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 02 — Programs</div>
            <h1 className={styles.sectionTitle}>Career tracks built for <em>modern</em> travel and hospitality careers.</h1>
          </div>
          <p className={styles.bodyText} style={{ maxWidth: 760, marginBottom: 28 }}>
            Three programmes are accepting applications now. Three more are being readied for upcoming intakes.
          </p>
          <div className={styles.programGrid}>
            {LIVE_SITE_PROGRAMS.map((item) => (
              <article key={item.code} className={styles.programCard}>
                <div className={styles.programInner}>
                  <div className={styles.programArrow}>↗</div>
                  <div className={styles.programNumber}>{item.code}</div>
                  <h3 className={styles.programTitle}>
                    {item.title}
                    {item.comingSoon ? (
                      <span style={{ display: "inline-block", marginLeft: 10, padding: "3px 10px", fontSize: "0.62em", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 999, background: "#F4B400", color: "#0B1F3A", verticalAlign: "middle" }}>Coming Soon</span>
                    ) : null}
                  </h3>
                  <div className={styles.programDescription}>{item.body}</div>
                  <div className={styles.programMeta}>
                    <div className={styles.metaRow}><span>Duration</span><span>{item.duration}</span></div>
                    <div className={styles.metaRow}><span>Format</span><span>{item.format}</span></div>
                    <div className={styles.metaRow}><span>Next cohort</span><span>{item.cohort}</span></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
