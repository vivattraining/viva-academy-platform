/** @type {import('next').NextConfig} */

// Security headers (audit row H-F4, 16 May 2026).
//
// Applied to every response. Notes per header:
//
// - Content-Security-Policy
//     Tight by default. Inline scripts allowed via 'unsafe-inline' because
//     Next.js' streaming HTML uses inline RSC payloads — a nonce-based CSP
//     would also work but requires middleware coordination. The script-src
//     allowlist explicitly permits Razorpay's checkout script (H-F5), which
//     the apply page injects dynamically. Anything else is rejected.
// - Strict-Transport-Security
//     1 year, includeSubDomains, preload — matches the API-side header.
// - X-Frame-Options + frame-ancestors
//     Login pages were clickjackable before this.
// - Referrer-Policy
//     Certificate verification tokens (e.g. /certificates/<token>) used to
//     leak via Referer to any third-party clicked from the cert page.
//     strict-origin-when-cross-origin stops that.
// - X-Content-Type-Options + Permissions-Policy
//     Standard hardening; no behavioural effect today but prevents future
//     content sniffing / unintended browser-API access.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://checkout.razorpay.com https://api.razorpay.com",
      "connect-src 'self' https://api.vivacareeracademy.com https://api.razorpay.com https://lumberjack.razorpay.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://api.razorpay.com",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), payment=(self), usb=(), accelerometer=(), gyroscope=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.21"],

  async headers() {
    return [
      {
        // Apply to all routes.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Certificate verification pages are public but carry PII in the
        // rendered HTML; prevent indexing on top of the per-page metadata
        // noindex hint.
        source: "/certificates/:token*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
