import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.css";

export default function AshishBhaiyaPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <Link className={styles.backLink} href="/">
            ← Back to VIVA
          </Link>

          <div className={styles.heroGrid}>
            <div>
              <div className={styles.kicker}>Guiding Mentor</div>
              <h1 className={styles.title}>Dr Ashish Gautam</h1>
              <p className={styles.subtitle}>Fondly known as Ashish Bhaiya</p>
              <p className={styles.lead}>
                He has dedicated some of the best years of his life serving the
                untouched, needy and the poor. His presence helps anchor VIVA in
                service, dignity and purpose-led education.
              </p>

              <div className={styles.tags}>
                <span>DivyaPrem</span>
                <span>Guiding Mentor</span>
                <span>Service & Compassion</span>
              </div>
            </div>

            <div className={styles.imageFrame}>
              <Image
                src="/faculty/ashish-bhaiya.jpg"
                alt="Dr Ashish Gautam, known as Ashish Bhaiya"
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                className={styles.image}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.story}>
        <div className={styles.wrap}>
          <div className={styles.sectionLabel}>Ashish Bhaiya&apos;s Mission</div>
          <div className={styles.storyGrid}>
            <div>
              <h2 className={styles.sectionTitle}>
                A life shaped by <em>service</em>
              </h2>
              <p>
                Ashish Bhaiya&apos;s journey reflects a deep commitment to
                humanity, seva and institution-building for those who are often
                overlooked. His work is rooted in the belief that compassion
                must be expressed through action, dignity and long-term support.
              </p>
              <p>
                For VIVA, this matters profoundly. Education here is not only
                about employability. It is also about character, responsibility
                and becoming the kind of professional who serves people with
                empathy and integrity.
              </p>
            </div>

            <blockquote className={styles.quote}>
              <p>
                “The true measure of education is not only what a student earns,
                but what values they carry into the world.”
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <section className={styles.values}>
        <div className={styles.wrap}>
          <div className={styles.cards}>
            <article className={styles.card}>
              <div className={styles.cardLabel}>01</div>
              <h3>Dignity in service</h3>
              <p>
                Service is not charity. It is respect, presence and the
                willingness to uplift people without diminishing them.
              </p>
            </article>
            <article className={styles.card}>
              <div className={styles.cardLabel}>02</div>
              <h3>Purpose-led growth</h3>
              <p>
                VIVA&apos;s ambition is not just to place students into careers,
                but to shape grounded professionals with clarity and purpose.
              </p>
            </article>
            <article className={styles.card}>
              <div className={styles.cardLabel}>03</div>
              <h3>Human-centred leadership</h3>
              <p>
                Ashish Bhaiya&apos;s guidance reminds us that leadership should
                always create care, trust and lasting value for communities.
              </p>
            </article>
          </div>

          <div className={styles.ctaRow}>
            <a
              className={styles.primaryButton}
              href="https://divyaprem.co.in/theman.aspx"
              target="_blank"
              rel="noreferrer"
            >
              Visit DivyaPrem
            </a>
            <Link className={styles.secondaryButton} href="/">
              Return to Homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
