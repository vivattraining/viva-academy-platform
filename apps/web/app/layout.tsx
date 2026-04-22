import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viva Career Academy Platform",
  description: "Standalone academy platform for Viva Career Academy and future academy brands."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
