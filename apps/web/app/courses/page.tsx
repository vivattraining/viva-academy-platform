import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../components/marketing-shell";
import styles from "../../components/claude-home.module.css";
import { getCourses } from "../../lib/courses-data";
import { slugForCourse } from "../../lib/courses-slug";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore Viva Career Academy programmes — Foundation in Travel & Tourism, Travel Career Accelerator, Event & MICE, Travel Operations, Food & Beverage. 16-week hybrid cohorts.",
  alternates: { canonical: "/courses" },
  openGraph: {
    title: "Courses · Viva Career Academy",
    description:
      "Five career tracks. One unwavering standard. Hybrid cohorts in travel, tourism and hospitality.",
    url: "https://www.vivacareeracademy.com/courses",
    type: "website",
  },
};

export default async function CoursesPage() {
  const programs = await getCourses();
  return (
    <MarketingShell activeHref="/courses">
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 02 — Programs</div>
            <h1 className={styles.sectionTitle}>Career tracks built for <em>modern</em> travel and hospitality careers.</h1>
          </div>
          <p className={styles.bodyText} style={{ maxWidth: 760, marginBottom: 28 }}>
            Two programmes are accepting applications now. Three more are being readied for upcoming intakes.
          </p>
          <div className={styles.programGrid}>
            {programs.map((item) => (
              <Link
                key={item.code}
                href={`/courses/${slugForCourse(item)}`}
                className={styles.programCard}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article style={{ height: "100%" }}>
                  <div className={styles.programInner}>
                    <div className={styles.programArrow}>↗</div>
                    <div className={styles.programNumber}>{item.code}</div>
                    <h3 className={styles.programTitle}>
                      {item.name}
                      {item.coming_soon ? (
                        <span style={{ display: "inline-block", marginLeft: 10, padding: "3px 10px", fontSize: "0.62em", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 999, background: "#F4B400", color: "#0B1F3A", verticalAlign: "middle" }}>Coming Soon</span>
                      ) : null}
                    </h3>
                    <div className={styles.programDescription}>{item.description}</div>
                    <div className={styles.programMeta}>
                      <div className={styles.metaRow}><span>Duration</span><span>{item.duration_label}</span></div>
                      <div className={styles.metaRow}><span>Format</span><span>{item.format_label}</span></div>
                      <div className={styles.metaRow}><span>Next cohort</span><span>{item.cohort_label}</span></div>
                      <div className={styles.metaRow}><span>Fee</span><span>{item.fee_display}</span></div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: "var(--muted, #2f3140)", fontStyle: "italic" }}>
            * All fees are GST inclusive.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
