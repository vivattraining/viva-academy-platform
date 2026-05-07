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
    name: "Dr Nitin Mittal",
    title: "Founder · CEO",
    company: "Hotel N Apartment (HNA) · PR Euro · National Coordinator, NIMA",
    description:
      "C-suite leader with 30+ years across travel management — procurement, operations, and global marketing. Holds one of India's first Ph.D.s in Film Tourism (Pondicherry University). Founded HNA in 2015 — a global corporate accommodation platform reaching 3M+ rooms across 120 countries — and PR Euro for European Permanent Residency. Appointed National Coordinator of NIMA in February 2025.",
    image: "/advisory-board/nitin-mittal.jpeg",
    imageAlt: "Dr Nitin Mittal",
    creds: ["Strategy", "MICE", "Hospitality", "Education"],
  },
  {
    code: "A · 02",
    name: "Dr Anup Tarafdar",
    title: "Founder · CEO",
    company: "EVENTEX · MICE TRAV · Thought Leaders Hub",
    description:
      "Entrepreneur, ecosystem builder, and global business networking strategist with 26+ years of industry experience. 3,000+ events delivered through EVENTEX. Drives the EVENTEX Startup Expo, MICE TRAV, and Thought Leaders Hub — connecting startups, investors, corporates, tourism boards, and industry leaders through high-impact collaborations and global opportunities.",
    image: "/advisory-board/anup-tarafdar.jpeg",
    imageAlt: "Dr Anup Tarafdar",
    creds: ["MICE", "Events", "Networking", "Startups"],
  },
  {
    code: "A · 03",
    name: "Rajiv Duggal",
    title: "Co-Founder · Director",
    company: "Travel Specialists · Travelart Maestros · Event Specialists",
    description:
      "31+ years in senior leadership across tourism, hospitality, infrastructure, retail, and cruise development. CEO roles at ZEE's tourism division (launched India's first cruise liner — now Cordelia Cruises), LAVASA Corporation, Select CITYWALK New Delhi, and DOTW across the Indian Subcontinent and Asia Pacific. Senior leadership at KUONI (SITA & SOTC) and TUI AG. Award-winning industry leader recognised by UNWTO and international tourism bodies.",
    image: "/advisory-board/rajiv-duggal.webp",
    imageAlt: "Rajiv Duggal",
    creds: ["Tourism", "Hospitality", "Cruise", "Strategy"],
  },
  {
    code: "A · 04",
    name: "Ashish Kumar",
    title: "Co-Chairman · FICCI Travel Technology & Digital Committee",
    company: "Member, FICCI Tourism Committee · Advisor, RankinLLM.ai · Formerly International Travel House (ITC Group)",
    description:
      "Senior travel, tourism, and hospitality leader with nearly 45 years of industry experience. Held leadership roles at International Travel House (ITC Group) across corporate travel, hospitality, tourism, and travel technology. Co-Chairman of the FICCI Travel Technology & Digital Committee and Member of the FICCI Tourism Committee, shaping industry dialogue on digital transformation and AI adoption in travel. Advisor to RankinLLM.ai on AI-led discovery, generative search, and digital visibility for travel and hospitality brands.",
    image: "/advisory-board/ashish-kumar.jpeg",
    imageAlt: "Ashish Kumar",
    creds: ["FICCI", "Travel Tech", "Hospitality", "AI Discovery"],
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
