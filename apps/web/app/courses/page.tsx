import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../components/marketing-shell";

import {
  V2_CATALOG,
  LEVEL_LABEL,
  LEVEL_BLURB,
  comingSoonLabel,
  formatPriceTag,
  type CatalogCourse,
} from "./v2-catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Viva Career Academy programme catalogue. Foundation, Pro, Elite, and specialisations — pick the path that fits where you are and where you're going.",
};

const LEVELS: CatalogCourse["level"][] = [
  "foundation",
  "pro",
  "elite",
  "specialisation",
];

export default function CoursesPage() {
  const groupedCourses: Record<string, CatalogCourse[]> = {};
  for (const level of LEVELS) groupedCourses[level] = [];
  for (const course of V2_CATALOG) {
    groupedCourses[course.level].push(course);
  }

  return (
    <MarketingShell activeHref="/courses">
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>§ — Programme catalogue</p>
          <h1 className={styles.heroTitle}>
            A career ladder for travel, tourism, hospitality, and service —{" "}
            <em>built one level at a time.</em>
          </h1>
          <p className={styles.heroLead}>
            Start at Foundation. Grow into Pro. Graduate into Elite. Add specialisations
            wherever your career points. Each programme is taught by industry operators
            and built to deliver a real job, not a certificate.
          </p>
        </div>
      </section>

      {LEVELS.map((level) => {
        const courses = groupedCourses[level];
        if (!courses || courses.length === 0) return null;
        return (
          <section key={level} className={styles.levelBlock}>
            <header className={styles.levelHead}>
              <div className={styles.levelKicker}>{LEVEL_LABEL[level]}</div>
              <p className={styles.levelBlurb}>{LEVEL_BLURB[level]}</p>
            </header>

            <div className={styles.grid}>
              {courses.map((course) => {
                const comingSoon = comingSoonLabel(course);
                const isOpen = course.status === "open";
                return (
                  <article
                    key={course.code}
                    className={`${styles.card} ${comingSoon ? styles.cardSoon : ""}`}
                  >
                    <div className={styles.cardCode}>{course.code}</div>
                    <h2 className={styles.cardTitle}>{course.name}</h2>
                    {course.tagline ? (
                      <p className={styles.cardTagline}>{course.tagline}</p>
                    ) : null}
                    <p className={styles.cardBody}>{course.short_description}</p>

                    <dl className={styles.cardMeta}>
                      <div>
                        <dt>Duration</dt>
                        <dd>{course.duration_label}</dd>
                      </div>
                      {course.format ? (
                        <div>
                          <dt>Format</dt>
                          <dd>{course.format}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>Investment</dt>
                        <dd>{formatPriceTag(course)}</dd>
                      </div>
                      {isOpen && course.cohort_start_date ? (
                        <div>
                          <dt>Cohort starts</dt>
                          <dd>{course.cohort_start_date}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className={styles.cardFoot}>
                      {comingSoon ? (
                        <span className={styles.badgeSoon}>{comingSoon}</span>
                      ) : (
                        <span className={styles.badgeOpen}>
                          Now open · Apply for {course.cohort_start_date ?? "next cohort"}
                        </span>
                      )}
                      <Link
                        href={isOpen ? "/apply" : `/courses/${course.slug}`}
                        className={
                          isOpen ? styles.cardCtaPrimary : styles.cardCtaGhost
                        }
                      >
                        {isOpen ? "Begin application" : "Read more"}{" "}
                        <span className={styles.cardArrow}>↗</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className={styles.closing}>
        <p>
          Not sure which level fits you? Most learners start at Foundation. Already in
          the industry?{" "}
          <Link href="/apply">Talk to admissions</Link> — we&apos;ll place you at the
          right starting line.
        </p>
      </section>
    </MarketingShell>
  );
}
