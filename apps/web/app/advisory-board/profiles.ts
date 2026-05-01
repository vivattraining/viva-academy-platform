/**
 * Advisory Board profiles.
 *
 * This is the editorial source of truth for the page. Each profile
 * renders into the grid on /advisory-board. Replace the placeholder
 * entries with real Advisory Board members, photographs, and bios.
 *
 * Image guidance:
 *   - Drop the photo at apps/web/public/advisory-board/<file>.jpg
 *   - Reference it as `/advisory-board/<file>.jpg` in `image`
 *   - Aim for a 4:5 portrait crop, ~1200px on the long edge
 *   - Until photos exist, leave `image` as null — the card falls back
 *     to a refined initials-block portrait that matches the visual
 *     language of the rest of the site.
 */

export type AdvisorProfile = {
  /** Sequential identifier shown above the name (e.g. "A · 01"). */
  code: string;
  /** Full name as it should appear on the card. */
  name: string;
  /** Title or position. e.g. "Chief Strategy Officer" */
  title: string;
  /** Current company (or "Formerly: <X>" if retired / past association). */
  company: string;
  /** One-paragraph bio — keep it tight, 30–50 words. */
  description: string;
  /** Optional photo path served from /public, e.g. "/advisory-board/raj.jpg". */
  image?: string | null;
  /** Alt text for the photograph — defaults to the person's name. */
  imageAlt?: string;
  /** Optional credentials shown as small chips below the bio. */
  creds?: string[];
};

export const ADVISORS: AdvisorProfile[] = [
  {
    code: "A · 01",
    name: "Advisor Name",
    title: "Senior Industry Leader",
    company: "Global Travel & Hospitality Brand",
    description:
      "Three decades of leadership across global travel, hospitality, and aviation. Brings depth in operational scale, brand discipline, and the talent pipelines that build a modern travel industry.",
    image: null,
    creds: ["Strategy", "Operations", "Talent"],
  },
  {
    code: "A · 02",
    name: "Advisor Name",
    title: "Founder · Travel Technology",
    company: "Indian Travel Tech Pioneer",
    description:
      "Built one of India's defining travel technology companies. Advises on the convergence of distribution, AI, and customer experience — and how academy curricula must evolve in response.",
    image: null,
    creds: ["Distribution", "Technology", "AI"],
  },
  {
    code: "A · 03",
    name: "Advisor Name",
    title: "Industry Veteran",
    company: "Tourism Board / Public Sector",
    description:
      "Senior public-sector experience in tourism policy, destination marketing, and Indo-Pacific corridors. Helps Viva align curriculum with where the industry — and the country — is heading.",
    image: null,
    creds: ["Policy", "Destinations", "Strategy"],
  },
  {
    code: "A · 04",
    name: "Advisor Name",
    title: "Hospitality Educator",
    company: "Leading Hospitality School",
    description:
      "Decades of academic experience designing and running hospitality programmes. Provides curriculum rigour and professional standards alignment for the Viva flagship and specialisations.",
    image: null,
    creds: ["Curriculum", "Pedagogy", "Standards"],
  },
  {
    code: "A · 05",
    name: "Advisor Name",
    title: "MICE & Corporate Travel Leader",
    company: "Global Event Agency",
    description:
      "Runs global event and corporate travel programmes for Fortune 500 brands. Mentors the MICE & Event Design specialisation and opens international hiring corridors.",
    image: null,
    creds: ["MICE", "Corporate Travel", "Hiring"],
  },
  {
    code: "A · 06",
    name: "Advisor Name",
    title: "Hospitality Group Executive",
    company: "International Hotel Group",
    description:
      "Senior leadership across luxury and mid-market hospitality. Connects Viva graduates to operational rotations, corporate trainee programmes, and management track placements.",
    image: null,
    creds: ["Hospitality", "Placement", "Training"],
  },
];
