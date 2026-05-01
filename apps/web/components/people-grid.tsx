import Image from "next/image";

import styles from "./people-grid.module.css";

export type PeopleGridProfile = {
  code: string;
  name: string;
  title: string;
  company: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
  creds?: string[];
};

/**
 * Shared profile-card grid used by /advisory-board and /patron.
 *
 * Visual language matches the homepage faculty section but elevates the
 * spacing, typography hierarchy, and image treatment so the page reads
 * as a premium, world-class index of leadership figures.
 *
 * Card structure (top to bottom):
 *   - 4:5 portrait image (or initials fallback)
 *   - Sequential code chip ("A · 01")
 *   - Name (Libre Caslon Text serif)
 *   - Title + company (sans, smaller)
 *   - Short bio (1 paragraph)
 *   - Optional cred chips
 *
 * Cards stretch to row height; titles and bios align across the row
 * via subgrid-style internal layout (flex column + auto margins).
 */
export function PeopleGrid({
  profiles,
  imageBasePath,
}: {
  profiles: PeopleGridProfile[];
  /** Optional. Used in the alt text fallback. */
  imageBasePath?: string;
}) {
  return (
    <section className={styles.grid}>
      {profiles.map((person) => (
        <article key={person.code} className={styles.card}>
          <div className={styles.portrait}>
            {person.image ? (
              <Image
                className={styles.photo}
                src={person.image}
                alt={person.imageAlt || person.name}
                fill
                sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
            ) : (
              <div className={styles.fallback}>
                <span className={styles.fallbackInitials}>
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className={styles.fallbackLabel}>Portrait</span>
              </div>
            )}
            <div className={styles.code}>{person.code}</div>
          </div>

          <div className={styles.body}>
            <h3 className={styles.name}>{person.name}</h3>
            <div className={styles.title}>{person.title}</div>
            <div className={styles.company}>{person.company}</div>
            <p className={styles.description}>{person.description}</p>
            {person.creds && person.creds.length ? (
              <div className={styles.creds}>
                {person.creds.map((cred) => (
                  <span key={cred} className={styles.cred}>
                    {cred}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
