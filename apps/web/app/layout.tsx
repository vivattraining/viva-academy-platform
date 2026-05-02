import "./globals.css";

import type { Metadata } from "next";
import { Great_Vibes } from "next/font/google";

// Cursive font for the certificate signatures + cert holder name.
// Snell Roundhand / Apple Chancery are macOS-only — Great Vibes is a
// Google webfont that renders the same on every OS. The font-family
// chain in certificate-view.tsx falls back to OS cursive if this fails
// to load (offline first paint, blocked DNS, etc.).
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vivacareeracademy.com"),
  title: {
    default: "Viva Career Academy",
    template: "%s | Viva Career Academy",
  },
  description:
    "Premium career academy for travel, hospitality, and aviation. Apply, learn, and certify with Viva.",
  applicationName: "Viva Career Academy",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    type: "website",
    siteName: "Viva Career Academy",
    title: "Viva Career Academy",
    description:
      "Premium career academy for travel, hospitality, and aviation. Apply, learn, and certify with Viva.",
    url: "https://www.vivacareeracademy.com",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viva Career Academy",
    description:
      "Premium career academy for travel, hospitality, and aviation. Apply, learn, and certify with Viva.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Viva Career Academy",
  alternateName: "VCA",
  url: "https://www.vivacareeracademy.com",
  logo: "https://www.vivacareeracademy.com/icon.svg",
  foundingDate: "2011",
  description:
    "VIVA Career Academy prepares the next generation of travel, tourism, and hospitality professionals through hybrid live cohorts, industry mentorship and global placement pathways.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mumbai",
    addressRegion: "MH",
    addressCountry: "IN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "admissions",
      email: "admission@vivacareeracademy.com",
      telephone: "+91-70421-07711",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
  ],
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={greatVibes.variable}>
      <body>
        {children}
        {/* Organization JSON-LD — helps Google's Knowledge Panel
            and improves brand SERP grouping. SEO audit item #6. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
      </body>
    </html>
  );
}
