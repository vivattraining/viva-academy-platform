import type { Metadata } from "next";

import { PeopleGrid } from "../../components/people-grid";
import { SiteShell } from "../../components/site-shell";

import { PATRONS } from "./profiles";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Patron",
  description:
    "The honorary patrons of Viva Career Academy — senior figures in travel, hospitality, and public service who lend their reputation, networks, and judgement to the institution.",
};

export default function PatronPage() {
  return (
    <SiteShell
      activeHref="/patron"
      eyebrow="§ — Patron"
      title="Honorary patrons of Viva Career Academy."
      description="Patrons of the academy lend their name, network, and judgement to the institution. Their endorsement signals the standard Viva is built to."
      navVariant="public"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          A patron is more than an endorsement — they are a quiet anchor for an institution. The Viva patrons are senior figures in Indian and international travel, hospitality, and the cultural sector who agreed to lend their reputation to the academy because they believe the country needs a serious, modern, world-class career school for the travel industry.
        </p>
        <p className={styles.body}>
          Their role is to keep the institution honest about its standards, open doors at the most senior levels of industry and government, and ensure Viva is built for the long arc — not the news cycle.
        </p>
      </section>

      <PeopleGrid profiles={PATRONS} imageBasePath="/patron" />

      <section className={styles.closing}>
        <p>
          The patron list is small by design. Nominations are made by the Advisory Board and considered annually.
        </p>
      </section>
    </SiteShell>
  );
}
