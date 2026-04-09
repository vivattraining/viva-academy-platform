"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { ACADEMY_THEME } from "../lib/academy";
import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import { PUBLIC_CONTACT, PUBLIC_NAV } from "../lib/public-site-content";

type BrandingState = {
  tenant_name: string;
  brand_name: string;
  academy_name: string;
  custom_domain: string;
  primary_color: string;
  accent_color: string;
};

const DEFAULT_BRANDING: BrandingState = {
  tenant_name: DEFAULT_TENANT,
  brand_name: ACADEMY_THEME.name,
  academy_name: "VIVA Career Academy",
  custom_domain: ACADEMY_THEME.domain,
  primary_color: "#000666",
  accent_color: "#B51A1E",
};

export function MarketingShell({
  activeHref,
  children,
}: {
  activeHref: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  const [branding, setBranding] = useState<BrandingState>(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;

    async function resolveBranding() {
      const host = typeof window !== "undefined" ? window.location.host : DEFAULT_BRANDING.custom_domain;
      try {
        const data = await apiRequest<{ tenant_name: string; branding: BrandingState }>(
          `/api/v1/academy/tenants/by-domain/${encodeURIComponent(host)}`
        );
        if (!cancelled) {
          setBranding({ ...DEFAULT_BRANDING, ...data.branding, tenant_name: data.tenant_name });
        }
      } catch {
        if (!cancelled) setBranding(DEFAULT_BRANDING);
      }
    }

    void resolveBranding();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="editorial-shell">
      <header className="editorial-nav">
        <div className="editorial-nav-inner">
          <Link href="/" className="editorial-brand">
            <span className="editorial-brand-text">{branding.brand_name}</span>
          </Link>

          <nav className="editorial-nav-links">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`editorial-nav-link${item.href === activeHref ? " active" : ""}`}
              >
                {item.label === "Home" ? "Programs" : item.label}
              </Link>
            ))}
          </nav>

          <div className="editorial-nav-actions">
            <span className="editorial-nav-icon" aria-hidden="true">🏛</span>
            <span className="editorial-nav-icon" aria-hidden="true">🌐</span>
            <Link href="/apply" className="editorial-enroll">Enroll Now</Link>
          </div>
        </div>
      </header>

      <div className="editorial-main">{children}</div>

      <footer className="editorial-footer">
        <div className="editorial-footer-inner">
          <div className="editorial-footer-brand">
            <div className="editorial-footer-title">{branding.brand_name}</div>
            <p>
              Empowering the next generation of travel leaders through rigorous academic training and research-led instruction.
            </p>
          </div>
          <div className="editorial-footer-links">
            <a href="/contact">Privacy Policy</a>
            <a href="/contact">Terms of Service</a>
            <a href="/contact">Institutional Disclosures</a>
            <a href="/contact">Compliance</a>
            <a href="/contact">Accessibility</a>
          </div>
          <div className="editorial-footer-meta">
            <div>{PUBLIC_CONTACT.email}</div>
            <div>{PUBLIC_CONTACT.phone}</div>
            <div>© 2026 Viva Training Institute. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
