import type { Metadata } from "next";

import { MarketingShell } from "../../components/marketing-shell";
import styles from "../../components/claude-home.module.css";
import { DEFAULT_TENANT } from "../../lib/api";

export const metadata: Metadata = {
  title: "Trainers",
  description:
    "Meet the senior travel, tourism, and hospitality professionals who lead live cohorts at Viva Career Academy.",
  alternates: { canonical: "/trainers" },
  openGraph: {
    title: "Trainers · Viva Career Academy",
    description:
      "Industry-embedded faculty leading hybrid cohorts in travel, tourism, hospitality, and MICE.",
    url: "https://www.vivacareeracademy.com/trainers",
    type: "website",
  },
};

type PublicTrainer = {
  id: string;
  full_name: string;
  photo_url?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  specializations?: string[] | null;
  years_experience?: number | null;
};

/**
 * Static fallback faculty roster.
 *
 * Renders when the API returns zero approved trainer profiles (e.g. fresh
 * deploy, before the admin has invited and approved trainers via Phase D).
 * Once trainers are onboarded through `/admin/invites` → `/trainer/profile`
 * → `/admin/review/trainers`, their API entries take over and this list is
 * ignored.
 *
 * Image guidance: drop photos at apps/web/public/faculty/<slug>.jpg and
 * reference as `/faculty/<slug>.jpg` in `photo_url`. Until photos exist,
 * leave `photo_url` as null — the card renders an initials portrait.
 */
const STATIC_FACULTY: PublicTrainer[] = [
  {
    id: "static-vikas-khanduri",
    full_name: "Vikas Khanduri",
    photo_url: "/faculty/vikas-khanduri-updated.png",
    bio:
      "Faculty Head and Co-Founder. Thirty years with large travel companies — including Cox & Kings, Kuoni and SOTC. Leads VIVA Career Academy's flagship Travel Management programme.",
    expertise: ["Travel", "Tourism", "Operations"],
    specializations: ["Foundation Programme", "Costing & Pricing"],
    years_experience: 30,
  },
  {
    id: "static-geeta-bhat",
    full_name: "Geeta Bhat",
    photo_url: "/faculty/geeta-bhat.jpg",
    bio:
      "35+ years in the travel, hospitality, and events industry, including specialisation in inbound tourism. Former faculty at Sita Academy, Kuoni Academy, and YWCA. Combines industry expertise with structured training, equipping students with industry-relevant skills and a strong understanding of how the travel business operates.",
    expertise: ["Travel", "Hospitality", "Inbound Tourism"],
    specializations: ["Tour & Travel Management", "Faculty Mentorship"],
    years_experience: 35,
  },
  {
    id: "static-ranjit-vig",
    full_name: "Ranjit Vig",
    photo_url: "/faculty/ranjit-vig.jpeg",
    bio:
      "Guest Faculty. Four decades in Indian travel and tourism. Founder of CAAIR Travels (1985), a luxury travel, MICE, and events firm headquartered in New Delhi and Gurugram, with the CEED events division delivering premium corporate events, incentive programmes, and luxury destination weddings. Past President of Skal International Delhi; Board Member of TAAI; National Treasurer of Skal International India. First appointed American Express representative in India (1993–2016) — recipient of the American Express Award of Excellence for the Asia Pacific region.",
    expertise: ["Travel", "MICE", "Luxury Events"],
    specializations: ["Corporate Travel", "Destination Weddings", "Incentive Programmes"],
    years_experience: 40,
  },
];

function apiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.ACADEMY_API_URL ||
    "http://localhost:8000";
  return base.replace(/\/+$/, "");
}

async function fetchPublicTrainers(): Promise<PublicTrainer[]> {
  try {
    const url = `${apiBaseUrl()}/api/v1/academy/trainers/public?tenant_name=${encodeURIComponent(DEFAULT_TENANT)}`;
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { items?: PublicTrainer[] };
    return data.items || [];
  } catch {
    return [];
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function initials(name: string): string {
  if (!name) return "?";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((piece) => piece[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

export default async function TrainersPage() {
  const apiTrainers = await fetchPublicTrainers();
  // Prefer the API roster when admin has approved profiles; otherwise show
  // the static fallback so the public page always has known faculty visible.
  const trainers = apiTrainers.length > 0 ? apiTrainers : STATIC_FACULTY;
  const hasTrainers = trainers.length > 0;

  return (
    <MarketingShell activeHref="/trainers">
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ — Faculty</div>
            <h1 className={styles.sectionTitle}>
              Industry-embedded <em>trainers</em> leading every cohort.
            </h1>
          </div>
          <p className={styles.bodyText} style={{ maxWidth: 760, marginBottom: 28 }}>
            Each VIVA cohort is led by senior travel, tourism, hospitality, and MICE
            professionals who bring operator-level standards into the classroom. Faculty
            are reviewed and vetted by the academy before they appear here.
          </p>

          {hasTrainers ? (
            <div className={styles.programGrid}>
              {trainers.map((trainer) => {
                const exp = (trainer.expertise || []).slice(0, 3);
                const bio = trainer.bio ? truncate(trainer.bio, 200) : "";
                return (
                  <article key={trainer.id} className={styles.programCard}>
                    <div className={styles.programInner}>
                      <div
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#0B1F3A",
                          color: "#fffaf2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontWeight: 600,
                          fontSize: 22,
                          marginBottom: 14,
                        }}
                      >
                        {trainer.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={trainer.photo_url}
                            alt={trainer.full_name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          initials(trainer.full_name)
                        )}
                      </div>
                      <h3 className={styles.programTitle}>{trainer.full_name}</h3>
                      {bio ? (
                        <div className={styles.programDescription}>{bio}</div>
                      ) : null}
                      {exp.length ? (
                        <div
                          style={{
                            marginTop: 14,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {exp.map((chip) => (
                            <span
                              key={chip}
                              style={{
                                fontSize: 11,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                padding: "4px 10px",
                                borderRadius: 999,
                                background: "rgba(11, 31, 58, 0.07)",
                                color: "#0B1F3A",
                                fontFamily: "'Inter', system-ui, sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {typeof trainer.years_experience === "number" ? (
                        <p
                          style={{
                            marginTop: 14,
                            fontSize: 12,
                            color: "var(--muted, #2f3140)",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {trainer.years_experience}+ years experience
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              className={styles.programGrid}
              style={{ minHeight: 80 }}
            >
              <article className={styles.programCard}>
                <div className={styles.programInner}>
                  <h3 className={styles.programTitle}>Faculty roster being prepared</h3>
                  <div className={styles.programDescription}>
                    The academy is finalising the next cohort&rsquo;s teaching team.
                    Faculty profiles will appear here after admin approval.
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
