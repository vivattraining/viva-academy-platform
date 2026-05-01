import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingShell } from "../../../components/marketing-shell";

import {
  V2_CATALOG,
  LEVEL_LABEL,
  comingSoonLabel,
  formatPriceTag,
  type CatalogCourse,
} from "../v2-catalog";
import styles from "./page.module.css";

type Params = { slug: string };

export function generateStaticParams() {
  return V2_CATALOG.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = V2_CATALOG.find((c) => c.slug === slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.name,
    description: course.short_description,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const course = V2_CATALOG.find((c) => c.slug === slug);
  if (!course) notFound();

  const isOpen = course.status === "open";
  const soonLabel = comingSoonLabel(course);

  return (
    <MarketingShell activeHref="/courses">
      <article className={styles.page}>
        <header className={styles.head}>
          <div className={styles.headInner}>
            <Link href="/courses" className={styles.backLink}>
              ← All courses
            </Link>
            <p className={styles.eyebrow}>
              {course.code} · {LEVEL_LABEL[course.level]}
            </p>
            <h1 className={styles.title}>{course.name}</h1>
            {course.tagline ? <p className={styles.tagline}>{course.tagline}</p> : null}
            <div className={styles.statusRow}>
              {soonLabel ? (
                <span className={styles.badgeSoon}>{soonLabel}</span>
              ) : (
                <span className={styles.badgeOpen}>
                  Now open · Cohort starts {course.cohort_start_date}
                </span>
              )}
              <span className={styles.metaPill}>{course.duration_label}</span>
              {course.format ? (
                <span className={styles.metaPill}>{course.format}</span>
              ) : null}
              <span className={styles.metaPill}>{formatPriceTag(course)}</span>
            </div>
          </div>
        </header>

        <section className={styles.body}>
          <div className={styles.bodyInner}>
            <p className={styles.lead}>{course.short_description}</p>

            {course.tiers.length > 1 ? (
              <div className={styles.tiers}>
                <h2 className={styles.sectionTitle}>Pricing tiers</h2>
                <div className={styles.tierGrid}>
                  {course.tiers.map((tier) => (
                    <div key={tier.name} className={styles.tier}>
                      <div className={styles.tierName}>{tier.name}</div>
                      <div className={styles.tierPrice}>
                        ₹{tier.price.toLocaleString("en-IN")}
                      </div>
                      {tier.description ? (
                        <p className={styles.tierDesc}>{tier.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.cta}>
              {isOpen ? (
                <Link href="/apply" className={styles.ctaPrimary}>
                  Begin application →
                </Link>
              ) : (
                <Link href="/apply" className={styles.ctaGhost}>
                  Notify me when this opens →
                </Link>
              )}
              <Link href="/courses" className={styles.ctaGhost}>
                Browse all courses
              </Link>
            </div>

            {soonLabel ? (
              <div className={styles.soonNote}>
                <p>
                  This programme is being readied for{" "}
                  <strong>{soonLabel.replace("Coming soon · ", "")}</strong>. The
                  syllabus, faculty, and pricing will appear here once the cohort opens.
                  Apply now to be on the early-access list — we&apos;ll notify you the
                  day enrolment goes live.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </article>
    </MarketingShell>
  );
}
