import type { MetadataRoute } from "next";

/**
 * PWA manifest. Eliminates the GET /manifest.json 404 some browsers
 * auto-request. Icons reference the auto-generated /icon and /apple-icon
 * routes (see app/icon.tsx and app/apple-icon.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Viva Career Academy",
    short_name: "Viva Academy",
    description:
      "Premium career academy for travel, hospitality, and aviation. Apply, learn, and certify.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
