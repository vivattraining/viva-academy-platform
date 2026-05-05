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

  // Course detail URLs — clean slugs (p01, p02, …) generated from codes
  // in apps/api/app/course_catalog.py. The /courses/[code] page accepts
  // either the clean slug or a URL-encoded full code, so old links stay
  // valid; we publish the clean form.
  const courseSlugs = ["p01", "p02", "p03", "p04", "p05"];
  const courseRoutes: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
    url: `${SITE}/courses/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.85,
    lastModified: now,
  }));

  return [...staticRoutes, ...courseRoutes];
}
