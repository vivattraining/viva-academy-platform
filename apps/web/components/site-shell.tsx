"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { ACADEMY_THEME, INTERNAL_NAV, PUBLIC_NAV, STUDENT_NAV } from "../lib/academy";

type NavVariant = "public" | "internal" | "student";

const NAV_BY_VARIANT: Record<NavVariant, ReadonlyArray<{ label: string; href: string }>> = {
  public: PUBLIC_NAV,
  internal: INTERNAL_NAV,
  student: STUDENT_NAV,
};
import { apiRequest, DEFAULT_TENANT } from "../lib/api";
import styles from "./claude-home.module.css";

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
  primary_color: ACADEMY_THEME.primary,
  accent_color: ACADEMY_THEME.secondary,
};

export function SiteShell({
  activeHref,
  eyebrow,
  title,
  description,
  children,
  primaryCta,
  secondaryCta,
  navVariant = "public",
}: {
  activeHref: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /**
   * Which audience the page is for. Picks the nav links shown in the top bar:
   *   - "public":   anonymous / login / apply / internal-login  (default)
   *   - "internal": signed-in staff workspaces
   *   - "student":  signed-in student workspace
   */
  navVariant?: NavVariant;
}) {
  const navItems = NAV_BY_VARIANT[navVariant];
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
        return;
      } catch {
        // fall back to tenant seed branding
      }

      try {
        const data = await apiRequest<{ tenant_name: string; branding: BrandingState }>(
          `/api/v1/academy/tenants/${encodeURIComponent(DEFAULT_TENANT)}`
        );
        if (!cancelled) {
          setBranding({ ...DEFAULT_BRANDING, ...data.branding, tenant_name: data.tenant_name });
        }
      } catch {
        if (!cancelled) {
          setBranding(DEFAULT_BRANDING);
        }
      }
    }

    void resolveBranding();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page} data-nav-variant={navVariant}>
      <div className={styles.topBanner}>
        Secure Academy Workspace <b>·</b> Viva Career Academy <b>·</b> Operator + Learner Access
      </div>
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>V</span>
            <span className={styles.brandWord}>
              <span className={styles.brandName}>VIVA</span>
              <span className={styles.brandTag}>{branding.custom_domain}</span>
            </span>
          </Link>
          <div className={styles.navLinks}>
              {navItems.map((item) => (
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
            {primaryCta ? <Link href={primaryCta.href} className={styles.button}>{primaryCta.label}</Link> : null}
            {secondaryCta ? <Link href={secondaryCta.href} className={styles.buttonGhost}>{secondaryCta.label}</Link> : null}
          </div>
        </div>
      </nav>

      <section className={styles.section} style={{ paddingTop: "56px" }}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>{eyebrow}</div>
            <div>
              <h1 className={styles.sectionTitle}>{title}</h1>
              <p className={styles.bodyText} style={{ marginTop: 20, maxWidth: 760 }}>{description}</p>
              <div className={styles.footerSocial} style={{ marginTop: 22 }}>
                <span className={styles.chip}><span className={styles.dot} /> {branding.academy_name}</span>
                <span className={styles.chip}>Own domain</span>
                <span className={styles.chip}>Zoom-enabled live classes</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 24 }}>{children}</div>
        </div>
      </section>

      <footer className={styles.footer} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.footerBottom}>
            <div>© 2026 Viva Career Academy. Secure workspace.</div>
            <div className={styles.footerSocial}>
              {navVariant === "public" ? (
                <>
                  <Link href="/login">Login</Link>
                  <Link href="/apply">Admissions</Link>
                </>
              ) : null}
              {navVariant === "internal" ? <Link href="/internal/login">Internal sign-in</Link> : null}
              {navVariant === "student" ? <Link href="/login">Student sign-in</Link> : null}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
