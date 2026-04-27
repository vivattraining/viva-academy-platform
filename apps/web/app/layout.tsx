import "./globals.css";

import type { Metadata } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
