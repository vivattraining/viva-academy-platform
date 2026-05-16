import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../components/marketing-shell";
import styles from "./help.module.css";

export const metadata: Metadata = {
  title: "Help Center · Viva Career Academy",
  description:
    "User manuals and reference guides for students, admins, operations, and trainers. Step-by-step instructions for every workflow on the VIVA Career Academy platform.",
  alternates: { canonical: "/help" },
};

export default function HelpCenterPage() {
  return (
    <MarketingShell activeHref="/help">
      <article className={styles.page}>
        <div className={styles.eyebrow}>Help Center</div>
        <h1 className={styles.title}>How can we help you today?</h1>
        <p className={styles.subtitle}>
          User manuals for every role on the platform. Each guide walks through the
          tools and workflows you&rsquo;ll use day-to-day — written to be opened,
          scanned, and acted on in under five minutes. Pick your role below.
        </p>

        <div className={styles.cardGrid}>
          <Link href="/help/student" className={styles.card}>
            <div className={styles.cardLabel}>For learners</div>
            <h2 className={styles.cardTitle}>Student Manual</h2>
            <p className={styles.cardCopy}>
              Applying, paying, attending live sessions, completing chapters,
              taking the certification test, and downloading your certificate.
            </p>
          </Link>

          <Link href="/help/admin" className={styles.card}>
            <div className={styles.cardLabel}>For admins</div>
            <h2 className={styles.cardTitle}>Admin Manual</h2>
            <p className={styles.cardCopy}>
              User accounts, the course catalog, certification tests, the
              certificate manager, branding, and the messaging center.
            </p>
          </Link>

          <Link href="/help/operations" className={styles.card}>
            <div className={styles.cardLabel}>For operations</div>
            <h2 className={styles.cardTitle}>Operations Manual</h2>
            <p className={styles.cardCopy}>
              Reviewing applications, marking enrollments, batches and cohorts,
              attendance tracking, and student communications.
            </p>
          </Link>

          <Link href="/help/trainer" className={styles.card}>
            <div className={styles.cardLabel}>For faculty</div>
            <h2 className={styles.cardTitle}>Trainer Manual</h2>
            <p className={styles.cardCopy}>
              Completing your profile, hosting live sessions, uploading
              recordings, marking attendance, and reviewing student submissions.
            </p>
          </Link>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick links by task</h2>
          <p>
            If you&rsquo;d rather jump straight to the answer, here are the most common
            things people open the help center for:
          </p>
          <div className={styles.chipRow}>
            <Link className={styles.chip} href="/help/student#applying">How to apply</Link>
            <Link className={styles.chip} href="/help/student#paying">Paying my fee</Link>
            <Link className={styles.chip} href="/help/student#reserving">Reserving a seat</Link>
            <Link className={styles.chip} href="/help/student#live-sessions">Joining a live session</Link>
            <Link className={styles.chip} href="/help/student#certificate-test">Taking the test</Link>
            <Link className={styles.chip} href="/help/student#certificate">Sharing my certificate</Link>
            <Link className={styles.chip} href="/help/admin#user-management">Adding a user</Link>
            <Link className={styles.chip} href="/help/operations#applications">Reviewing applications</Link>
            <Link className={styles.chip} href="/help/trainer#sessions">Hosting a session</Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Still stuck?</h2>
          <p>
            The manuals cover ~95% of what you&rsquo;ll need. If something isn&rsquo;t
            answered — or doesn&rsquo;t match what you&rsquo;re seeing on screen — reach the
            VIVA team:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:hello@vivacareeracademy.com">hello@vivacareeracademy.com</a>
              {" "}— typical response within one working day.
            </li>
            <li>
              <strong>Phone:</strong>{" "}
              <a href="tel:+919876543210">+91 98765 43210</a>{" "}
              — Monday to Friday, 10am to 6pm IST.
            </li>
            <li>
              <strong>WhatsApp:</strong> the same number; we reply during
              business hours.
            </li>
          </ul>
          <div className={styles.callout}>
            <strong>Tip</strong>
            When you write in, include your application ID or student email so the
            team can find your record without a second back-and-forth. You&rsquo;ll find
            your application ID on the payment receipt page and in any email we
            send you.
          </div>
        </section>
      </article>
    </MarketingShell>
  );
}
