"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { ACADEMY_NAV, ACADEMY_THEME } from "../lib/academy";
import { apiRequest, DEFAULT_TENANT } from "../lib/api";

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
  secondaryCta
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

  const shortName = (branding.brand_name || DEFAULT_BRANDING.brand_name).slice(0, 4).toUpperCase();

  return (
    <main>
      <div className="shell">
        <header className="hero" style={{ padding: 24, marginBottom: 24, backdropFilter: "blur(18px)" }}>
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
                  background: `linear-gradient(135deg, ${branding.primary_color} 0%, #1A3457 100%)`
                }}
              >
                {shortName}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>{branding.brand_name}</div>
                <div className="eyebrow">{branding.custom_domain}</div>
              </div>
            </Link>
            <div className="nav-links">
              {ACADEMY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pill"
                  style={{
                    background: item.href === activeHref ? branding.primary_color : "rgba(255,255,255,0.78)",
                    color: item.href === activeHref ? "white" : ACADEMY_THEME.ink
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="eyebrow">{eyebrow}</div>
          <h1 style={{ fontSize: 52, lineHeight: 1.04, letterSpacing: "-0.06em", margin: "14px 0 12px", maxWidth: 920 }}>{title}</h1>
          <p className="muted" style={{ maxWidth: 860, fontSize: 16 }}>{description}</p>
          <div className="badge-row" style={{ marginTop: 18 }}>
            <div className="badge">{branding.academy_name}</div>
            <div className="badge">Own domain</div>
            <div className="badge">Zoom-enabled live classes</div>
          </div>
          {(primaryCta || secondaryCta) ? (
            <div className="button-row">
              {primaryCta ? <Link href={primaryCta.href} className="button-primary">{primaryCta.label}</Link> : null}
              {secondaryCta ? <Link href={secondaryCta.href} className="button-secondary">{secondaryCta.label}</Link> : null}
            </div>
          ) : null}
        </header>

        <div className="stack">{children}</div>
      </div>
    </main>
  );
}
