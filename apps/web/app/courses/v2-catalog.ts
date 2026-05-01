/**
 * v2 master-build catalog — the 4-level ladder + 5 specialisations.
 *
 * This is the file the marketing team edits to launch / pause / re-price
 * a course. The /courses page reads this list straight; the dev team
 * doesn't need to be involved per change.
 *
 * Each entry maps 1:1 to a row in the v2_courses DB table once the v2
 * schema migration ships (see apps/api/app/v2_models.py). Until then
 * this file is the source of truth and the page reads it directly.
 *
 * Status semantics:
 *   - "draft"        : not visible on the public site at all
 *   - "coming_soon"  : visible as a placeholder card with "Coming Soon — <month>"
 *   - "open"         : visible with "Now Open · Cohort starts <date>" + Apply CTA
 *   - "live"         : visible with full detail page and active enrolment
 */

export type CatalogTier = {
  name: string;
  price: number;          // INR; show "₹{n}" or "Starting at ₹{n}"
  currency: string;
  description?: string;
};

export type CatalogCourse = {
  code: string;
  slug: string;
  name: string;
  tagline?: string;
  short_description: string;

  level: "foundation" | "pro" | "elite" | "specialisation";
  is_specialisation: boolean;
  category: string;
  duration_label: string;
  duration_weeks?: number;

  status: "draft" | "coming_soon" | "open" | "live";
  target_launch_month?: string;   // ISO YYYY-MM
  cohort_start_date?: string;     // ISO YYYY-MM-DD
  application_deadline?: string;

  tiers: CatalogTier[];
  format?: string;
};

export const V2_CATALOG: CatalogCourse[] = [
  // -------- Level 1 — Foundation -----------------------------------------
  {
    code: "C001",
    slug: "travel-career-accelerator",
    name: "Travel Career Accelerator Program",
    tagline: "The 16-week foundation programme for a real career in travel.",
    short_description:
      "From sector orientation to live-leads execution. The flagship Viva programme that turns committed beginners into hire-ready travel professionals across operations, sales, and tour management.",
    level: "foundation",
    is_specialisation: false,
    category: "Core",
    duration_label: "16 weeks",
    duration_weeks: 16,
    status: "open",
    cohort_start_date: "2026-08-15",
    application_deadline: "2026-08-01",
    tiers: [
      { name: "Standard", price: 40000, currency: "INR" },
    ],
    format: "Hybrid · Live + Studio",
  },

  // -------- Level 1 (alt focus) — Operations Oriented --------------------
  {
    code: "C002",
    slug: "travel-operations-tour-management",
    name: "Travel Operations & Tour Management Program",
    tagline: "Build the operational discipline behind seamless travel.",
    short_description:
      "Itinerary design, GDS fundamentals, vendor coordination, on-ground operations. For learners who want to run trips end-to-end and become the backbone of a tour-operating business.",
    level: "foundation",
    is_specialisation: false,
    category: "Operations",
    duration_label: "16 weeks",
    duration_weeks: 16,
    status: "coming_soon",
    target_launch_month: "2026-08",
    tiers: [
      { name: "Standard", price: 35000, currency: "INR" },
    ],
    format: "Hybrid · Live + Studio",
  },

  // -------- Level 1 — MICE specialisation pathway ------------------------
  {
    code: "C003",
    slug: "event-mice-career-accelerator",
    name: "Event & MICE Career Accelerator",
    tagline: "Step into the high-impact world of corporate events.",
    short_description:
      "Meetings, incentives, conferences, exhibitions, and destination weddings. Event design, vendor coordination, budgeting, and on-ground execution for the rapidly growing MICE segment.",
    level: "foundation",
    is_specialisation: false,
    category: "Specialisation",
    duration_label: "16 weeks",
    duration_weeks: 16,
    status: "coming_soon",
    target_launch_month: "2026-09",
    tiers: [
      { name: "Standard", price: 45000, currency: "INR" },
    ],
    format: "Hybrid · Live + Studio",
  },

  // -------- Level 1 — F&B / Restaurant Services --------------------------
  {
    code: "C004",
    slug: "food-beverage-service-professional",
    name: "Food & Beverage Service Professional Program",
    tagline: "Restaurant-floor mastery for hospitality careers.",
    short_description:
      "Front-of-house service, beverage knowledge, guest handling, and the operational rhythm of a high-standard restaurant. Designed for learners stepping into hospitality and F&B service.",
    level: "foundation",
    is_specialisation: false,
    category: "Service",
    duration_label: "16 weeks",
    duration_weeks: 16,
    status: "coming_soon",
    target_launch_month: "2026-10",
    tiers: [
      { name: "Standard", price: 35000, currency: "INR" },
    ],
    format: "Hybrid · Live + Studio",
  },

  // -------- Level 2 — Pro Diploma ----------------------------------------
  {
    code: "C100",
    slug: "pro-diploma",
    name: "Pro Diploma",
    tagline: "Advanced execution and revenue skills for working professionals.",
    short_description:
      "12-week intensive layered on top of the Foundation programme. Advanced sales psychology, luxury itinerary design, vendor negotiation, yield management, and agency setup. For graduates ready to lead.",
    level: "pro",
    is_specialisation: false,
    category: "Advanced",
    duration_label: "12 weeks",
    duration_weeks: 12,
    status: "draft",
    target_launch_month: "2026-10",
    tiers: [
      { name: "Standard", price: 45000, currency: "INR" },
    ],
    format: "Hybrid · Live",
  },

  // -------- Level 3 — Elite Accelerator ----------------------------------
  {
    code: "C200",
    slug: "elite-accelerator",
    name: "Elite Accelerator",
    tagline: "Live leads. Real closing. Placement or business launch.",
    short_description:
      "An 8-week intensive that takes Pro graduates onto live industry leads, real client calls, and a structured placement-or-launch decision at the end. The route to seven-figure roles or your own agency.",
    level: "elite",
    is_specialisation: false,
    category: "Premium",
    duration_label: "8 weeks",
    duration_weeks: 8,
    status: "draft",
    target_launch_month: "2026-12",
    tiers: [
      { name: "Standard", price: 100000, currency: "INR" },
    ],
    format: "Live · Cohort",
  },

  // -------- Level 4 — Specialisations ------------------------------------
  {
    code: "C301",
    slug: "specialisation-luxury-travel",
    name: "Luxury Travel · Specialisation",
    tagline: "Design and sell at the very top of the market.",
    short_description:
      "Ultra-luxury hotels, private aviation, destination weddings, and concierge-grade personalisation. A short specialisation for advisors moving into the high-net-worth client segment.",
    level: "specialisation",
    is_specialisation: true,
    category: "Specialisation",
    duration_label: "4 weeks",
    duration_weeks: 4,
    status: "draft",
    target_launch_month: "2026-09",
    tiers: [{ name: "Standard", price: 20000, currency: "INR" }],
    format: "Live · Cohort",
  },
  {
    code: "C302",
    slug: "specialisation-mice",
    name: "MICE · Specialisation",
    tagline: "Move groups, run conferences, deliver incentive trips.",
    short_description:
      "A focused 3-week specialisation in group movement logistics, corporate event budgeting, and incentive-trip design.",
    level: "specialisation",
    is_specialisation: true,
    category: "Specialisation",
    duration_label: "3 weeks",
    duration_weeks: 3,
    status: "draft",
    target_launch_month: "2026-09",
    tiers: [{ name: "Standard", price: 15000, currency: "INR" }],
    format: "Live · Cohort",
  },
  {
    code: "C303",
    slug: "specialisation-gds",
    name: "GDS · Specialisation",
    tagline: "Master the global distribution system every agency runs on.",
    short_description:
      "Live GDS training (Amadeus or Sabre) — fares, PNR construction, ticketing, exchanges, refunds. The technical specialisation airline-counter and ticketing roles ask for.",
    level: "specialisation",
    is_specialisation: true,
    category: "Specialisation",
    duration_label: "6 weeks",
    duration_weeks: 6,
    status: "draft",
    target_launch_month: "2026-10",
    tiers: [{ name: "Standard", price: 30000, currency: "INR" }],
    format: "Live · Cohort",
  },
  {
    code: "C304",
    slug: "specialisation-visa",
    name: "Visa · Specialisation",
    tagline: "Documentation discipline that wins approvals.",
    short_description:
      "Country-by-country visa rules, common rejection patterns, and document-pack construction for outbound itineraries. A short, practical specialisation.",
    level: "specialisation",
    is_specialisation: true,
    category: "Specialisation",
    duration_label: "3 weeks",
    duration_weeks: 3,
    status: "draft",
    target_launch_month: "2026-09",
    tiers: [{ name: "Standard", price: 15000, currency: "INR" }],
    format: "Live · Cohort",
  },
  {
    code: "C305",
    slug: "specialisation-travel-content",
    name: "Travel Content Creator · Specialisation",
    tagline: "Build a creator practice on top of your travel skill.",
    short_description:
      "Storytelling, Instagram + YouTube growth, monetisation paths, brand collaborations — for travel professionals who want a personal-brand revenue layer.",
    level: "specialisation",
    is_specialisation: true,
    category: "Specialisation",
    duration_label: "4 weeks",
    duration_weeks: 4,
    status: "draft",
    target_launch_month: "2026-11",
    tiers: [{ name: "Standard", price: 20000, currency: "INR" }],
    format: "Hybrid",
  },
];

export const LEVEL_LABEL: Record<CatalogCourse["level"], string> = {
  foundation: "Level 1 · Foundation",
  pro: "Level 2 · Pro Diploma",
  elite: "Level 3 · Elite Accelerator",
  specialisation: "Level 4 · Specialisations",
};

export const LEVEL_BLURB: Record<CatalogCourse["level"], string> = {
  foundation:
    "Job-ready in 16 weeks. Pick the discipline that matches your career ambition — travel, operations, MICE, or hospitality.",
  pro: "12-week intensive for working professionals ready to step into senior execution and revenue ownership.",
  elite:
    "8-week placement-or-launch programme — live industry leads, real client calls, the route to seven-figure roles or your own agency.",
  specialisation:
    "Short, focused specialisations stacked on top of any Foundation programme. Build the depth that wins specific roles.",
};

export function formatPriceTag(course: CatalogCourse): string {
  const tier = course.tiers[0];
  if (!tier) return "";
  return `Starting at ₹${tier.price.toLocaleString("en-IN")}`;
}

export function comingSoonLabel(course: CatalogCourse): string | null {
  if (course.status !== "coming_soon" && course.status !== "draft") return null;
  if (!course.target_launch_month) return "Coming soon";
  const [y, m] = course.target_launch_month.split("-").map((n) => parseInt(n, 10));
  if (!y || !m) return "Coming soon";
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `Coming soon · ${months[m - 1]} ${y}`;
}
