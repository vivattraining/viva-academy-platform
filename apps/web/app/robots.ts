import type { MetadataRoute } from "next";

/**
 * Robots policy — public marketing pages indexable, every internal /
 * authenticated route disallowed. Keeps Google from accidentally crawling
 * (or worse, indexing the redirect chain of) the gated workspaces.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admissions",
          "/operations",
          "/roster",
          "/messages",
          "/trainer",
          "/student",
          "/dashboard",
          "/white-label",
          "/internal/",
          "/payment/",
        ],
      },
    ],
    host: "https://www.vivacareeracademy.com",
  };
}
