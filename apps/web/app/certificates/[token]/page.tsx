/**
 * Public certificate verification page.
 *
 * URL: /certificates/{token}
 *
 * Anyone with the token can hit this URL — typical use is a student
 * sharing the link with a recruiter. The token is 27 random URL-safe
 * characters, so the URL is not enumerable.
 *
 * Renders the certificate as inline SVG so the page is fully self-
 * contained — no client-side fetch, no dependency on JS, employers
 * can Print → Save as PDF directly from the browser.
 */
import { CertificateView } from "../../../components/certificate-view";

type Verification = {
  valid: boolean;
  student_name?: string;
  course_name?: string;
  course_code?: string;
  cohort_label?: string;
  score_pct?: number | null;
  issued_at?: string;
  verification_token?: string;
};

function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

async function verifyToken(token: string): Promise<Verification> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/api/v1/academy/certificates/verify/${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { valid: false };
    return (await res.json()) as Verification;
  } catch {
    return { valid: false };
  }
}

export default async function CertificatePage({
  params,
}: {
  params: { token: string };
}) {
  const data = await verifyToken(params.token);
  return (
    <main style={{ minHeight: "100vh", background: "#1a1410", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <CertificateView data={data} />
    </main>
  );
}
