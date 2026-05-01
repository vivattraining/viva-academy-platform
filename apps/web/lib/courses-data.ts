/**
 * Server-side course catalog fetcher.
 *
 * SINGLE SOURCE OF TRUTH:
 *   apps/api/app/course_catalog.py
 *     → GET /api/v1/academy/courses/catalog
 *       → this file (no hardcoded course data — pure fetch)
 *         → homepage cards, /courses page, application form
 *
 * To change ANY course attribute — name, price, cohort, duration,
 * description, title split, reservation fee — edit
 * `apps/api/app/course_catalog.py` and redeploy. Every surface
 * picks up the change automatically.
 *
 * The frozen snapshot at the bottom is ONLY used as a fallback when
 * the API is unreachable (cold deploy, outage). It is NOT a place
 * to define course data; the catalog is.
 */

export type Course = {
  code: string;
  name: string;
  fee_inr: number;
  fee_display: string;
  reservation_fee_inr: number;
  reservation_fee_display: string;
  duration_label: string;
  format_label: string;
  cohort_label: string;
  coming_soon: boolean;
  title_lead: string;
  title_emphasis: string;
  description: string;
};

// Convenience alias used by code that pre-dates the type rename. Both refer
// to the same shape — the catalog item with all display copy folded in.
export type CourseCatalogItem = Course;
export type CourseDisplay = Pick<
  Course,
  "title_lead" | "title_emphasis" | "description" | "format_label"
>;

function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

/**
 * Fetch the course catalog from the API.
 *
 * Server-component only. Uses Next.js ISR caching with a 60-second
 * revalidation window — static HTML refreshes once per minute without
 * a redeploy. On a price change push, the API redeploys immediately
 * and the homepage HTML follows on its next revalidation.
 *
 * If the API is unreachable, this falls back to the frozen snapshot
 * below so the page still renders. The API is authoritative; the
 * snapshot may be stale.
 */
export async function getCourses(): Promise<Course[]> {
  try {
    const res = await fetch(`${apiBaseUrl()}/api/v1/academy/courses/catalog`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      throw new Error(`Catalog API returned ${res.status}`);
    }
    const data = (await res.json()) as { items: Course[] };
    return data.items;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[courses-data] catalog fetch failed, using snapshot:", error);
    return CATALOG_SNAPSHOT;
  }
}

// ---------------------------------------------------------------------------
// Frozen snapshot — used ONLY when the API fetch fails. This is a safety
// net to keep the homepage rendering during a deploy or outage. It is NOT
// where you edit course data; that lives in
// apps/api/app/course_catalog.py.
//
// If you forget to update this snapshot when changing the catalog, the
// only consequence is that during an API outage, the homepage shows
// slightly stale prices. The active site (when the API is up) always
// shows the live catalog.
// ---------------------------------------------------------------------------
const CATALOG_SNAPSHOT: Course[] = [
  {
    code: "P · 01",
    name: "Foundation Program in Travel & Tourism Industry",
    fee_inr: 24999,
    fee_display: "₹24,999*",
    reservation_fee_inr: 0,
    reservation_fee_display: "",
    duration_label: "16 weeks",
    format_label: "Hybrid",
    cohort_label: "26 May 2026",
    coming_soon: false,
    title_lead: "Foundation Program in",
    title_emphasis: "Travel & Tourism Industry",
    description:
      "The 16-week foundation programme. Sector orientation, customer journey, sales, operations, geography, MICE, costing, and business models — the disciplined first step into a real career in travel for committed beginners.",
  },
  {
    code: "P · 02",
    name: "Travel Career Accelerator Program",
    fee_inr: 36999,
    fee_display: "₹36,999*",
    reservation_fee_inr: 0,
    reservation_fee_display: "",
    duration_label: "16 weeks",
    format_label: "Hybrid",
    cohort_label: "6 Jun 2026",
    coming_soon: false,
    title_lead: "Travel Career",
    title_emphasis: "Accelerator Program",
    description:
      "Master the commercial side of travel. Build expertise in client acquisition, product positioning, pricing strategy, and relationship management. Learn how to plan, sell, and deliver experiences end-to-end — designed to prepare you for high-performance roles in travel sales and business development.",
  },
  {
    code: "P · 03",
    name: "Event & MICE Career Accelerator (Specialisation)",
    fee_inr: 36999,
    fee_display: "₹36,999*",
    reservation_fee_inr: 5000,
    reservation_fee_display: "₹5,000",
    duration_label: "16 weeks",
    format_label: "Hybrid",
    cohort_label: "Aug 2026",
    coming_soon: true,
    title_lead: "Event & MICE",
    title_emphasis: "Career Accelerator (Specialisation)",
    description:
      "Step into the world of high-impact events. Corporate meetings, incentives, conferences, exhibitions, and destination weddings. Event conceptualisation, vendor coordination, budgeting, and on-ground execution — for those aiming to build careers in India's fastest-growing MICE and experiential events segment.",
  },
  {
    code: "P · 04",
    name: "Travel Operations & Tour Management Program",
    fee_inr: 36999,
    fee_display: "₹36,999*",
    reservation_fee_inr: 5000,
    reservation_fee_display: "₹5,000",
    duration_label: "16 weeks",
    format_label: "Hybrid",
    cohort_label: "Aug 2026",
    coming_soon: true,
    title_lead: "Travel Operations &",
    title_emphasis: "Tour Management",
    description:
      "Operations-oriented programme. Itinerary design, GDS fundamentals, destination knowledge, vendor coordination, and end-to-end tour execution. Build the operational discipline behind seamless travel — for the people who run trips end-to-end.",
  },
  {
    code: "P · 05",
    name: "Food & Beverage Service Professional Program",
    fee_inr: 49999,
    fee_display: "₹49,999*",
    reservation_fee_inr: 5000,
    reservation_fee_display: "₹5,000",
    duration_label: "16 weeks",
    format_label: "Hybrid",
    cohort_label: "Aug 2026",
    coming_soon: true,
    title_lead: "Food & Beverage",
    title_emphasis: "Service Professional",
    description:
      "Restaurant-floor mastery for hospitality careers. Front-of-house service, beverage knowledge, guest handling, and the operational rhythm of high-standard restaurants. Designed for learners stepping into hospitality and F&B service roles.",
  },
];
