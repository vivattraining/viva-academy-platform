import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIVA Academy Platform",
  description: "Standalone white-label academy OS for VIVA and future institutes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

