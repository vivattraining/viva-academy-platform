import type { MetadataRoute } from "next";

const SITE = "https://www.vivacareeracademy.com";

/**
 * Public-route sitemap. Submitted to Google Search Console after
 * launch — see SEO audit (2026-05-01) item #1.
 *
 * Fully static: doesn't fetch the API at build time. The api project
 * builds in parallel on Vercel and isn't guaranteed to be available
 * during a web build. Course codes here mirror
 * `apps/api/app/course_catalog.py` — keep in sync when adding a course.
 *
 * Dynamic certificate URLs (`/certificates/[token]`) are explicitly
 * NOT listed: those are private to each student and shouldn't be
 * discoverable by search engines.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,                changeFrequency: "weekly",  priority: 1.0, lastModified: now },
    { url: `${SITE}/apply`,           changeFrequency: "weekly",  priority: 0.95, lastModified: now },
    { url: `${SITE}/courses`,         changeFrequency: "weekly",  priority: 0.9, lastModified: now },
    { url: `${SITE}/curriculum`,      changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${SITE}/trainers`,        changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${SITE}/advisory-board`,  changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${SITE}/patron`,          changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${SITE}/contact`,         changeFrequency: "yearly",  priority: 0.6, lastModified: now },
    { url: `${SITE}/brochure`,        changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${SITE}/privacy`,         changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${SITE}/terms`,           changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${SITE}/disclosures`,     changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${SITE}/accessibility`,   changeFrequency: "yearly",  priority: 0.3, lastModified: now },
  ];

  // Course detail URLs — codes mirror apps/api/app/course_catalog.py.
  // Pages don't exist yet (forward-compatible), so flag low priority
  // until they ship.
  const courseCodes = ["P · 01", "P · 02", "P · 03", "P · 04", "P · 05"];
  const courseRoutes: MetadataRoute.Sitemap = courseCodes.map((code) => ({
    url: `${SITE}/courses/${encodeURIComponent(code)}`,
    changeFrequency: "monthly" as const,
    priority: 0.85,
    lastModified: now,
  }));

  return [...staticRoutes, ...courseRoutes];
}
