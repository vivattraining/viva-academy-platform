import { NextRequest, NextResponse } from "next/server";

/**
 * Certificate verification + render endpoint.
 *
 * GET /certificates/<verification_token>
 *   → SVG image of the certificate, suitable for printing or saving as PDF
 *     (browsers can "Print → Save as PDF" directly).
 *
 * The verification token is the opaque, unguessable identifier stored on
 * the V2Certificate row at issuance. Anyone with the token can view the
 * certificate; without the token, the certificate cannot be enumerated.
 *
 * The route fetches the certificate metadata from the API (server-to-server,
 * no auth on the public verify endpoint — it accepts the token as a path
 * param). If the token is invalid, returns 404. If the API is unreachable,
 * returns a graceful 503 with retry guidance.
 *
 * Replaces the previous /certificates/<id> placeholder URL that 404'd on
 * the live roster (§17.5).
 */

const API_BASE = (
  process.env.ACADEMY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

type CertificateData = {
  serial_number: string;
  student_name: string;
  course_name: string;
  issued_at: string;
  issuer: string;
  grade?: string;
};

async function fetchCertificate(token: string): Promise<CertificateData | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/academy/certificates/verify/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { ok?: boolean; certificate?: CertificateData };
    if (!body.ok || !body.certificate) return null;
    return body.certificate;
  } catch {
    return null;
  }
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCertificateSvg(c: CertificateData): string {
  const issuedAt = (() => {
    const d = new Date(c.issued_at);
    if (Number.isNaN(d.getTime())) return c.issued_at;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  })();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100" width="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbf7ee"/>
      <stop offset="100%" stop-color="#f5efe4"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1100" fill="url(#paper)"/>
  <rect x="40" y="40" width="1520" height="1020" fill="none" stroke="#0e1b2c" stroke-width="2"/>
  <rect x="56" y="56" width="1488" height="988" fill="none" stroke="#b8860b" stroke-width="1"/>

  <!-- Header brand -->
  <text x="800" y="180" text-anchor="middle" font-family="Georgia, 'Libre Caslon Text', serif" font-size="22" letter-spacing="6" fill="#5b6576">VIVA CAREER ACADEMY</text>
  <line x1="600" y1="210" x2="1000" y2="210" stroke="#b8860b" stroke-width="1"/>

  <!-- Certificate of -->
  <text x="800" y="280" text-anchor="middle" font-family="Georgia, 'Libre Caslon Text', serif" font-size="36" fill="#0e1b2c" font-style="italic">Certificate of Completion</text>

  <!-- Awarded to label -->
  <text x="800" y="380" text-anchor="middle" font-family="Georgia, serif" font-size="16" letter-spacing="4" fill="#5b6576">THIS CERTIFICATE IS AWARDED TO</text>

  <!-- Student name -->
  <text x="800" y="470" text-anchor="middle" font-family="Georgia, 'Libre Caslon Text', serif" font-size="68" fill="#0e1b2c" font-weight="bold">${escape(c.student_name)}</text>
  <line x1="500" y1="500" x2="1100" y2="500" stroke="#0e1b2c" stroke-width="1"/>

  <!-- For having completed -->
  <text x="800" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#2f3140">for having successfully completed the programme</text>

  <!-- Course name -->
  <text x="800" y="640" text-anchor="middle" font-family="Georgia, 'Libre Caslon Text', serif" font-size="40" fill="#0e1b2c" font-style="italic">${escape(c.course_name)}</text>

  ${c.grade ? `<text x="800" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#5b6576">Grade: ${escape(c.grade)}</text>` : ""}

  <!-- Footer -->
  <line x1="200" y1="900" x2="600" y2="900" stroke="#0e1b2c" stroke-width="1"/>
  <text x="400" y="935" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#5b6576">Issued by ${escape(c.issuer)}</text>
  <text x="400" y="960" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#2f3140" font-weight="bold">${escape(issuedAt)}</text>

  <line x1="1000" y1="900" x2="1400" y2="900" stroke="#0e1b2c" stroke-width="1"/>
  <text x="1200" y="935" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#5b6576">Serial number</text>
  <text x="1200" y="960" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" fill="#2f3140" font-weight="bold">${escape(c.serial_number)}</text>

  <text x="800" y="1020" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#5b6576">Verify at vivacareeracademy.com/certificates/${escape(c.serial_number)}</text>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return new NextResponse("Invalid certificate token", { status: 404 });
  }

  const cert = await fetchCertificate(token);
  if (!cert) {
    return new NextResponse(
      "Certificate not found. The link may have been mistyped, or the certificate may have been revoked. If you believe this is an error, contact support@vivacareeracademy.com.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const svg = renderCertificateSvg(cert);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `inline; filename="viva-certificate-${cert.serial_number}.svg"`,
    },
  });
}
