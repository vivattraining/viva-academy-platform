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
  primary_color: ACADEMY_THEME.primary,
  accent_color: ACADEMY_THEME.secondary,
};

export function MarketingShell({
  activeHref,
  eyebrow,
  title,
  description,
  children,
  primaryCta,
  secondaryCta,
}: {
  activeHref: string;
  eyebrow: string;
  title: string;
  description: string;
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
    <main>
      <div className="shell">
        <header className="hero" style={{ padding: 24, marginBottom: 24 }}>
          <div className="nav" style={{ marginBottom: 20 }}>
            <Link href="/" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  color: "white",
                  background: `linear-gradient(135deg, ${branding.primary_color} 0%, #1A3457 100%)`,
                }}
              >
                VIVA
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>{branding.brand_name}</div>
                <div className="eyebrow">Powered by Viva Voyages</div>
              </div>
            </Link>
            <div className="nav-links">
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pill"
                  style={{
                    background: item.href === activeHref ? branding.primary_color : "rgba(255,255,255,0.78)",
                    color: item.href === activeHref ? "white" : ACADEMY_THEME.ink,
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="pill">Login</Link>
            </div>
          </div>

          <div className="eyebrow">{eyebrow}</div>
          <h1 style={{ fontSize: 52, lineHeight: 1.04, letterSpacing: "-0.06em", margin: "14px 0 12px", maxWidth: 920 }}>{title}</h1>
          <p className="muted" style={{ maxWidth: 860, fontSize: 16 }}>{description}</p>
          {(primaryCta || secondaryCta) ? (
            <div className="button-row">
              {primaryCta ? <Link href={primaryCta.href} className="button-primary">{primaryCta.label}</Link> : null}
              {secondaryCta ? <Link href={secondaryCta.href} className="button-secondary">{secondaryCta.label}</Link> : null}
            </div>
          ) : null}
        </header>

        <div className="stack">{children}</div>

        <footer className="card" style={{ marginTop: 24 }}>
          <div className="split">
            <div className="stack" style={{ gap: 10 }}>
              <div className="eyebrow">Viva Training Institute</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em" }}>
                Built to launch serious travel careers.
              </div>
              <p className="muted" style={{ margin: 0 }}>
                Industry-led training, live faculty interaction, disciplined progression, and a premium institute experience under the VIVA brand.
              </p>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <div className="eyebrow">Contact</div>
              <div className="muted">{PUBLIC_CONTACT.email}</div>
              <div className="muted">{PUBLIC_CONTACT.phone}</div>
              <div className="muted">{PUBLIC_CONTACT.offices}</div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
