import type { Metadata } from "next";

import { PeopleGrid } from "../../components/people-grid";
import { SiteShell } from "../../components/site-shell";

import { ADVISORS } from "./profiles";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Advisory Board",
  description:
    "Meet the senior industry leaders who shape Viva Career Academy's curriculum, hiring corridors, and standards across travel, tourism, hospitality, and MICE.",
};

export default function AdvisoryBoardPage() {
  return (
    <SiteShell
      activeHref="/advisory-board"
      eyebrow="§ — Advisory Board"
      title="Senior industry leaders shaping the academy."
      description="Viva is built alongside the people who run the travel industry — they review the curriculum, open hiring corridors, and hold the institution to the standard a serious career launchpad demands."
      navVariant="public"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          The Viva Advisory Board is a small, deliberate group. Each member brings decades of operating experience across travel, hospitality, MICE, and aviation — and an ongoing seat at the table for curriculum review, faculty selection, and learner outcomes.
        </p>
        <p className={styles.body}>
          Their role is not ceremonial. Advisors meet with the academy team quarterly, review every cohort&apos;s progression, and unlock placement and mentorship opportunities for committed learners. The result is a programme that stays calibrated to where the industry is going — not where it was.
        </p>
      </section>

      <PeopleGrid profiles={ADVISORS} imageBasePath="/advisory-board" />

      <section className={styles.closing}>
        <p>
          We add advisors carefully, in dialogue with the senior travel industry. If you would like to nominate someone — or join us yourself — please reach out via the admissions page.
        </p>
      </section>
    </SiteShell>
  );
}
