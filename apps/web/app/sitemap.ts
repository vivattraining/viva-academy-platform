import type { MetadataRoute } from "next";

import { getCourses } from "../lib/courses-data";

const SITE = "https://www.vivacareeracademy.com";

/**
 * Public-route sitemap. Submitted to Google Search Console after
 * launch — see SEO audit (2026-05-01) item #1.
 *
 * Includes every static public page plus per-course detail pages
 * driven from the live catalog (`getCourses`). Dynamic certificate
 * URLs are explicitly NOT listed: those are private to each
 * student and shouldn't be discoverable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Try to enumerate course detail URLs from the live catalog.
  // Fall back to a static snapshot if the API call fails at build time.
  let courses: { code: string }[] = [];
  try {
    courses = await getCourses();
  } catch {
    courses = [
      { code: "P · 01" },
      { code: "P · 02" },
      { code: "P · 03" },
      { code: "P · 04" },
      { code: "P · 05" },
    ];
  }

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

  // Course detail URLs — use the code as a slug, URL-encoded.
  // (Detail pages exist on the roadmap; sitemap is forward-compatible.)
  const courseRoutes: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${SITE}/courses/${encodeURIComponent(c.code)}`,
    changeFrequency: "monthly" as const,
    priority: 0.85,
    lastModified: now,
  }));

  return [...staticRoutes, ...courseRoutes];
}
