import { MarketingShell } from "../../components/marketing-shell";
import styles from "../../components/claude-home.module.css";
import { AI_PLATFORM_PILLARS } from "../../lib/public-site-content";

export default function AIPlatformPage() {
  return (
    <MarketingShell activeHref="/ai-platform">
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 06 — AI Layer</div>
            <h1 className={styles.sectionTitle}>A human-led academy with an <em>AI</em> intelligence layer underneath.</h1>
          </div>
          <div className={styles.programGrid}>
            {AI_PLATFORM_PILLARS.map((item, index) => (
              <article key={item.title} className={styles.programCard}>
                <div className={styles.programInner}>
                  <div className={styles.programNumber}>{`A · 0${index + 1}`}</div>
                  <h3 className={styles.programTitle}>{item.title}</h3>
                  <div className={styles.programDescription}>{item.body}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
