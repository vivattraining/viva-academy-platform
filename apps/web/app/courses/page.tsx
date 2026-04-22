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
            The programmes page now follows the restored landing language: academic, editorial, premium, and placement-oriented.
          </p>
          <div className={styles.programGrid}>
            {LIVE_SITE_PROGRAMS.map((item) => (
              <article key={item.code} className={styles.programCard}>
                <div className={styles.programInner}>
                  <div className={styles.programArrow}>↗</div>
                  <div className={styles.programNumber}>{item.code}</div>
                  <h3 className={styles.programTitle}>{item.title}</h3>
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
          <div className={styles.formatGrid} style={{ marginTop: 32 }}>
            <article className={styles.formatCard}>
              <div className={styles.tag}><span className={styles.dot} /> Payment options</div>
              <h3>Flexible fee structures for a <em>serious</em> cohort.</h3>
              <p>Support full-fee enrollment, deposit-based admissions, and Razorpay-driven collection once live keys are connected.</p>
            </article>
            <article className={`${styles.formatCard} ${styles.formatCardSecondary}`}>
              <div className={styles.tag}><span className={styles.dot} /> Upsell ladder</div>
              <h3>Specialisations unlock after the <em>flagship</em> track.</h3>
              <p>MICE, Luxury Travel, Ticketing, and DMC-focused tracks sit on top of the core academy journey.</p>
            </article>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
