import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingShell } from "../../../components/marketing-shell";
import styles from "../../../components/claude-home.module.css";
import { getCourses } from "../../../lib/courses-data";
import { findCourseByCodeOrSlug, slugForCourse } from "../../../lib/courses-slug";

const SITE = "https://www.vivacareeracademy.com";

type Params = { code: string };

/**
 * Static-generate one page per course at build time. The catalog is the
 * source of truth so this list mirrors `apps/api/app/course_catalog.py`.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const courses = await getCourses();
  return courses.map((course) => ({ code: slugForCourse(course) }));
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const courses = await getCourses();
  const course = findCourseByCodeOrSlug(courses, params.code);
  if (!course) {
    return {
      title: "Course not found",
      robots: { index: false, follow: false },
    };
  }
  const url = `${SITE}/courses/${slugForCourse(course)}`;
  return {
    title: `${course.name} · Viva Career Academy`,
    description: course.description,
    alternates: { canonical: `/courses/${slugForCourse(course)}` },
    openGraph: {
      title: `${course.name} · Viva Career Academy`,
      description: course.description,
      url,
      type: "website",
    },
  };
}

const SYLLABUS_HIGHLIGHTS: Record<string, string[]> = {
  p01: [
    "Sector orientation — the structure of India's travel and tourism industry",
    "Customer journey, sales psychology, and the consultative-sales method",
    "Geography, destinations, visa & airline fundamentals",
    "Operations workflow — bookings, GDS basics, vendor handling",
    "MICE, costing, and itinerary design",
    "Career readiness — communication, interview prep, placement",
  ],
  p02: [
    "Client acquisition — pipeline, prospecting, qualification",
    "Product positioning across leisure, corporate and bespoke segments",
    "Pricing strategy and margin discipline",
    "Relationship management and account expansion",
    "End-to-end deal lifecycle, from proposal to delivery",
    "Sales leadership in a multi-product travel business",
  ],
  p03: [
    "MICE landscape — corporate meetings, incentives, conferences, exhibitions",
    "Event conceptualisation and creative briefing",
    "Vendor coordination — venues, AV, F&B, talent",
    "Budgeting, sponsor relations, ROI measurement",
    "On-ground execution discipline and run-of-show",
    "Destination weddings and high-stakes experiential events",
  ],
  p04: [
    "Itinerary design and destination knowledge depth",
    "GDS fundamentals (Amadeus / Galileo) and ticketing flow",
    "Vendor coordination — DMCs, hoteliers, transport",
    "Tour costing, FIT vs GIT, dynamic packaging",
    "On-tour management and crisis handling",
    "End-to-end tour execution across domestic and international",
  ],
  p05: [
    "Front-of-house service standards and guest interaction",
    "Beverage knowledge — wine, spirits, coffee, tea, mocktails",
    "Order taking, table service sequence, billing",
    "Service flow under pressure during peak covers",
    "F&B economics — cost control, wastage, upsell discipline",
    "Career pathways into hotels, fine-dining, and cruise lines",
  ],
};

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What is the format of the programme?",
    a: "Hybrid — a mix of live online sessions and in-person residencies. Each week includes structured pre-recorded chapters, live-trainer sessions, and a graded submission. Recordings are available for 24-48 hours after every live session.",
  },
  {
    q: "Who is the programme for?",
    a: "Committed beginners and career-switchers serious about a career in travel, tourism, or hospitality. Graduates and final-year students are welcome. We screen for intent and readiness — not for prior industry exposure.",
  },
  {
    q: "Do I get a certificate?",
    a: "Yes. On passing the final certification test, you receive a Viva Career Academy certificate with a public verifiable URL. Certificates can be added to your LinkedIn under Licenses & Certifications.",
  },
  {
    q: "Is there a placement support?",
    a: "Yes. The placement team works with you on interview preparation and connects you with the academy's hiring partner network. The placement guarantee applies to learners who clear the certification test at the threshold score.",
  },
  {
    q: "How do I pay the fees?",
    a: "All fees are quoted GST-inclusive and are paid via Razorpay (UPI, cards, netbanking) on the application page. For live cohorts the full fee is paid upfront; coming-soon cohorts let you reserve a seat with a ₹5,000 advance, balance due within 14 days of cohort confirmation.",
  },
];

export default async function CourseDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const courses = await getCourses();
  const course = findCourseByCodeOrSlug(courses, params.code);
  if (!course) {
    notFound();
  }
  const slug = slugForCourse(course);
  const syllabus = SYLLABUS_HIGHLIGHTS[slug] || [];

  // JSON-LD: Course schema, helps Google render rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "Viva Career Academy",
      sameAs: SITE,
    },
    url: `${SITE}/courses/${slug}`,
    courseCode: course.code,
    offers: {
      "@type": "Offer",
      price: course.fee_inr,
      priceCurrency: "INR",
      category: course.coming_soon ? "Reservation" : "Tuition",
      availability: course.coming_soon
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock",
    },
    timeRequired: course.duration_label,
    educationalCredentialAwarded: "Viva Career Academy Certificate",
  };

  const applyHref = course.coming_soon
    ? `/apply?code=${encodeURIComponent(course.code)}&intent=reserve`
    : `/apply?code=${encodeURIComponent(course.code)}`;
  const ctaLabel = course.coming_soon ? "Reserve a seat" : "Apply now";

  return (
    <MarketingShell activeHref="/courses">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ {course.code}</div>
            <h1 className={styles.sectionTitle}>
              {course.title_lead}{" "}
              <em>{course.title_emphasis}</em>
              {course.coming_soon ? (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 14,
                    padding: "4px 12px",
                    fontSize: "0.45em",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    borderRadius: 999,
                    background: "#F4B400",
                    color: "#0B1F3A",
                    verticalAlign: "middle",
                  }}
                >
                  Coming Soon
                </span>
              ) : null}
            </h1>
          </div>
          <p
            className={styles.bodyText}
            style={{ maxWidth: 760, marginBottom: 24, fontSize: "1.05rem" }}
          >
            {course.description}
          </p>

          {/* Key facts row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              marginTop: 8,
              marginBottom: 28,
              maxWidth: 880,
            }}
          >
            <KeyFact label="Duration" value={course.duration_label} />
            <KeyFact label="Format" value={course.format_label} />
            <KeyFact label="Next cohort" value={course.cohort_label} />
            <KeyFact
              label="Fee"
              value={course.fee_display}
              hint={
                course.coming_soon && course.reservation_fee_display
                  ? `Reserve with ${course.reservation_fee_display}`
                  : "GST inclusive"
              }
            />
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link
              href={applyHref}
              style={{
                display: "inline-block",
                background: "#0B1F3A",
                color: "#f5efe4",
                padding: "12px 26px",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {ctaLabel} →
            </Link>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                color: "#0B1F3A",
                padding: "12px 22px",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: 600,
                letterSpacing: "0.02em",
                border: "1px solid rgba(11,31,58,0.25)",
              }}
            >
              Talk to admissions
            </Link>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      {syllabus.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <div className={styles.kicker}>§ Curriculum</div>
              <h2 className={styles.sectionTitle}>
                What you&apos;ll <em>actually learn</em>.
              </h2>
            </div>
            <p className={styles.bodyText} style={{ maxWidth: 760, marginBottom: 22 }}>
              Each week unlocks progressively. The full week list is shared with you on day one
              so you know exactly what&apos;s coming. Below is the headline of each track this
              programme covers.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {syllabus.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: "14px 18px",
                    borderLeft: "3px solid #b8860b",
                    background: "rgba(11, 31, 58, 0.03)",
                    fontSize: 15,
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ color: "#b8860b", marginRight: 8, fontWeight: 600 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ How it works</div>
            <h2 className={styles.sectionTitle}>
              Hybrid, <em>cohort-paced</em>, with weekly trainer reviews.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 18,
              marginTop: 6,
            }}
          >
            <HowCard
              title="Day-one visibility"
              body="On enrolment, your full course is visible — every week, every chapter title, every learning outcome. Future weeks unlock automatically as the cohort progresses."
            />
            <HowCard
              title="Weekly live sessions"
              body="A live trainer-led session each week, with chapter recordings published within 24–48 hours. Attendance is auto-tracked from the Zoom join — your trainer sees who's keeping up."
            />
            <HowCard
              title="Trainer feedback"
              body="Submit each week's assignment in the workspace. Your trainer reviews and writes feedback before the next module unlocks. Resubmission windows are built in."
            />
            <HowCard
              title="Certification"
              body="Pass the auto-graded online test at the end of the programme to earn your certificate, with a public verifiable URL you can add to LinkedIn."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ FAQ</div>
            <h2 className={styles.sectionTitle}>Common <em>questions</em>.</h2>
          </div>
          <div style={{ maxWidth: 820 }}>
            {FAQ_ITEMS.map((item, idx) => (
              <details
                key={idx}
                style={{
                  padding: "16px 0",
                  borderTop: idx === 0 ? "1px solid rgba(11,31,58,0.12)" : "none",
                  borderBottom: "1px solid rgba(11,31,58,0.12)",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 16,
                    color: "#0B1F3A",
                    listStyle: "none",
                  }}
                >
                  {item.q}
                </summary>
                <p style={{ marginTop: 10, color: "#2f3140", lineHeight: 1.6 }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <article
            style={{
              padding: "40px 36px",
              borderRadius: 8,
              background: "#0B1F3A",
              color: "#f5efe4",
              maxWidth: 880,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#F4B400",
                fontWeight: 600,
              }}
            >
              Ready when you are
            </div>
            <h3
              style={{
                marginTop: 12,
                marginBottom: 16,
                fontSize: "1.8rem",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {course.coming_soon
                ? `Reserve your seat for ${course.cohort_label}.`
                : `Next cohort: ${course.cohort_label}.`}
            </h3>
            <p style={{ marginBottom: 22, opacity: 0.9, fontSize: 15, lineHeight: 1.6 }}>
              {course.coming_soon
                ? `Pay ${course.reservation_fee_display} to lock your seat. Balance due within 14 days of cohort confirmation.`
                : `Apply now — seats are confirmed in the order they are paid for. ${course.fee_display} (GST inclusive).`}
            </p>
            <Link
              href={applyHref}
              style={{
                display: "inline-block",
                background: "#F4B400",
                color: "#0B1F3A",
                padding: "14px 28px",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {ctaLabel} →
            </Link>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}

function KeyFact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "rgba(245, 239, 228, 0.6)",
        border: "1px solid rgba(11, 31, 58, 0.08)",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#5a5040",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, color: "#0B1F3A" }}>
        {value}
      </div>
      {hint ? (
        <div style={{ marginTop: 4, fontSize: 12, color: "#5a5040" }}>{hint}</div>
      ) : null}
    </div>
  );
}

function HowCard({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        padding: "22px 22px",
        background: "rgba(245, 239, 228, 0.55)",
        border: "1px solid rgba(11, 31, 58, 0.08)",
        borderRadius: 6,
      }}
    >
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0B1F3A", marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ color: "#2f3140", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{body}</p>
    </article>
  );
}
