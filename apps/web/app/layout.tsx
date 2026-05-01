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
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={greatVibes.variable}>
      <body>{children}</body>
    </html>
  );
}
