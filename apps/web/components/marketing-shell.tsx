"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { ACADEMY_THEME } from "../lib/academy";
import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import styles from "./claude-home.module.css";
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
  academy_name: "Viva Career Academy",
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
    <main className={styles.page}>
      <div className={styles.topBanner}>
        Admissions Open · Viva Career Academy <b>·</b> Hybrid + Trainer-led <b>·</b> Travel Industry Careers
      </div>
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>V</span>
            <span className={styles.brandWord}>
              <span className={styles.brandName}>Viva Career Academy</span>
              <span className={styles.brandTag}>Est. 2011</span>
            </span>
          </Link>

          <div className={styles.navLinks}>
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ color: item.href === activeHref ? "var(--accent-deep)" : undefined }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.navCta}>
            <Link href="/apply" className={styles.button}>
              Apply Now <span className={styles.arrow}>↗</span>
            </Link>
          </div>
        </div>
      </nav>

      {children}

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <Link className={styles.brand} href="/">
                <span className={styles.brandMark}>V</span>
                <span className={styles.brandWord}>
                  <span className={styles.brandName}>Viva Career Academy</span>
                  <span className={styles.brandTag}>Est. 2011</span>
                </span>
              </Link>
            <p>
              A trainer-led, discipline-driven career platform for travel, tourism, hospitality, and service careers.
            </p>
          </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Explore</h6>
              <Link href="/courses">Courses</Link>
              <Link href="/curriculum">Curriculum</Link>
              <Link href="/trainers">Trainers</Link>
              <Link href="/advisory-board">Advisory Board</Link>
              <Link href="/patron">Patron</Link>
              <Link href="/apply">Apply</Link>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Contact</h6>
              <a href={`mailto:${PUBLIC_CONTACT.email}`}>{PUBLIC_CONTACT.email}</a>
              <a href={`tel:${PUBLIC_CONTACT.phone.replace(/\s+/g, "")}`}>{PUBLIC_CONTACT.phone}</a>
              <span>{branding.custom_domain}</span>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>© 2026 Viva Career Academy. All rights reserved.</div>
            <div className={styles.footerSocial}>
              <a href="/login">Student Portal</a>
              <a href="/apply">Admissions</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
