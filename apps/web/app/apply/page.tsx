import { MarketingShell } from "../../components/marketing-shell";
import styles from "../../components/claude-home.module.css";
import { PublicAdmissionsFlow } from "../../components/public-admissions-flow";
import { getCourses } from "../../lib/courses-data";

export default async function ApplyPage() {
  const programs = await getCourses();
  return (
    <MarketingShell activeHref="/apply">
      <section className={styles.admissions} id="admissions">
        <div className={`${styles.wrap} ${styles.admissionsBody}`}>
          <div>
            <div className={`${styles.eyebrow} ${styles.eyebrowDark}`}>§ 07 — Admissions</div>
            <h1 className={styles.admissionsTitle} style={{ marginTop: 20 }}>Your <em>career</em> begins with one application.</h1>
            <p className={styles.lead}>
              Submit your application, speak with admissions, and move into payment and enrollment through one guided flow.
            </p>
            <div className={styles.steps} style={{ marginTop: 28 }}>
              {[
                ["01", "Submit your application", "A 15-minute form with background, interests and one written response.", "15 min"],
                ["02", "Admissions conversation", "A 30-minute online conversation with the VCA team.", "Within 7 days"],
                ["03", "Offer and scholarship review", "Final fit, pricing and scholarship discussion.", "Within 14 days"],
              ].map(([number, title, copy, when]) => (
                <div className={styles.step} key={number}>
                  <div className={styles.stepNumber}>{number}</div>
                  <div><h5>{title}</h5><p>{copy}</p></div>
                  <div className={styles.stepWhen}>{when}</div>
                </div>
              ))}
            </div>
            <div className={styles.footerSocial} style={{ marginTop: 18 }}>
              <span className={styles.chip}>12-week flagship curriculum</span>
              <span className={styles.chip}>Live faculty review</span>
              <span className={styles.chip}>Placement-focused training</span>
            </div>
          </div>
          <div>
            <PublicAdmissionsFlow programs={programs} />
            <div className={styles.footerSocial} style={{ marginTop: 18 }}>
              <span className={styles.chip}>256-Bit SSL Security</span>
              <span className={styles.chip}>Razorpay Ready</span>
              <span className={styles.chip}>Trainer-led Review</span>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
