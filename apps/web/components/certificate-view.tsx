/**
 * Public-facing certificate view.
 *
 * Renders the verifiable certificate as inline SVG. Editorial V brand
 * mark at top, scalloped wax-seal stamp with iridescent holographic
 * shimmer in the centre, two cursive signatures, two-row footer.
 * When the verification token is invalid or the cert was revoked,
 * renders a "not valid" state so the URL is still honest about
 * what it found.
 */

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

function formatIssuedDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }).toUpperCase();
  } catch {
    return iso;
  }
}

function buildCertId(token?: string, courseCode?: string, issuedAt?: string): string {
  if (!token) return "—";
  const year = (() => {
    try { return new Date(issuedAt || "").getFullYear() || ""; } catch { return ""; }
  })();
  const codeSlug = (courseCode || "FT").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "FT";
  return `VCA-${codeSlug}-${year}-${token.slice(0, 6).toUpperCase()}`;
}

// Scalloped wax-seal polygon — 36 teeth, peaks at r=46, valleys at r=40.
// Computed once at module load; same for every cert render.
function buildScallopPoints(rOuter: number, rInner: number, teeth: number): string {
  const points: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI * 2) / (teeth * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    points.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(" ");
}

const SCALLOP_OUTER = buildScallopPoints(46, 40, 36);
const SCALLOP_INNER = buildScallopPoints(44, 38, 36);

export function CertificateView({ data }: { data: Verification }) {
  if (!data.valid) {
    return (
      <div style={{ background: "#fefcf6", padding: "48px 36px", borderRadius: 8, maxWidth: 520, textAlign: "center", color: "#0B1F3A", border: "1.5px solid #b8860b" }}>
        <div style={{ fontFamily: "'Libre Caslon Text', 'Times New Roman', serif", fontWeight: 700, fontSize: 22, letterSpacing: "0.06em", textTransform: "uppercase" }}>Certificate not found</div>
        <p style={{ marginTop: 14, fontSize: 14, color: "#5a5040", lineHeight: 1.6 }}>
          This token doesn&apos;t match a valid certificate. The certificate
          may have been revoked, or the URL may have been mistyped. Contact
          {" "}
          <a href="mailto:admission@vivacareeracademy.com" style={{ color: "#1f4ed8" }}>admission@vivacareeracademy.com</a>
          {" "}
          if you believe this is in error.
        </p>
      </div>
    );
  }

  const studentName = data.student_name || "—";
  const courseName = data.course_name || "—";
  const courseCode = data.course_code || "";
  const cohortLabel = data.cohort_label || "";
  const score = data.score_pct;
  const scoreLine = typeof score === "number"
    ? `with a final assessment score of ${Math.round(score)}%`
    : `with successful completion of all assessments`;
  const issuedDate = formatIssuedDate(data.issued_at);
  const certId = buildCertId(data.verification_token, courseCode, data.issued_at);
  const verifyUrl = data.verification_token
    ? `vivacareeracademy.com/certificates/${data.verification_token}`
    : "vivacareeracademy.com/certificates";

  return (
    <div style={{ width: "100%", maxWidth: 880, background: "#f5efe4", boxShadow: "0 4px 32px rgba(0,0,0,0.18)" }}>
      <svg viewBox="0 0 680 530" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="cert-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3eb5" />
            <stop offset="14%" stopColor="#a855f7" />
            <stop offset="28%" stopColor="#3b82f6" />
            <stop offset="42%" stopColor="#06b6d4" />
            <stop offset="56%" stopColor="#22c55e" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="84%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ff3eb5" />
          </linearGradient>
          <linearGradient id="cert-rainbow2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
            <stop offset="25%" stopColor="#22c55e" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#f97316" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="cert-sheen" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
          <radialGradient id="cert-dome" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </radialGradient>
          <path id="cert-curve-top" d="M 340 415 m -34 0 a 34 34 0 0 1 68 0" fill="none" />
          <path id="cert-curve-bottom" d="M 340 415 m -28 6 a 28 28 0 0 0 56 0" fill="none" />
        </defs>

        <rect x="0" y="0" width="680" height="530" fill="#f5efe4" />
        <rect x="14" y="14" width="652" height="502" fill="none" stroke="#0B1F3A" strokeWidth="2" />
        <rect x="22" y="22" width="636" height="486" fill="none" stroke="#b8860b" strokeWidth="0.6" />

        <g transform="translate(340,55)">
          <rect x="-19" y="-19" width="38" height="38" rx="2" fill="none" stroke="#0B1F3A" strokeWidth="1.5" />
          <text x="0" y="6" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="24" fontWeight="700" fill="#0B1F3A" textAnchor="middle">V</text>
          <line x1="-9" y1="9" x2="9" y2="9" stroke="#b8860b" strokeWidth="0.7" />
        </g>

        <text x="340" y="98" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="18" fontWeight="700" fill="#0B1F3A" textAnchor="middle" letterSpacing="6">VIVA CAREER ACADEMY</text>
        <text x="340" y="115" fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="9" fill="#5a5040" textAnchor="middle" letterSpacing="3">VCA · EST. 2011 · MUMBAI · DELHI · BANGALORE · GOA</text>

        <line x1="180" y1="135" x2="500" y2="135" stroke="#b8860b" strokeWidth="0.6" />

        <text x="340" y="170" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="22" fill="#0B1F3A" textAnchor="middle" letterSpacing="8">CERTIFICATE OF COMPLETION</text>
        <text x="340" y="205" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="13" fontStyle="italic" fill="#2f3140" textAnchor="middle">This is to certify that</text>

        <text x="340" y="263" fontFamily="var(--font-great-vibes), 'Great Vibes','Snell Roundhand','Apple Chancery','Brush Script MT','Lucida Handwriting',cursive" fontSize="46" fill="#0B1F3A" textAnchor="middle">{studentName}</text>
        <line x1="180" y1="278" x2="500" y2="278" stroke="#0B1F3A" strokeWidth="0.4" />

        <text x="340" y="304" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="13" fill="#2f3140" textAnchor="middle">has successfully completed the</text>
        <text x="340" y="332" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="17" fontWeight="700" fontStyle="italic" fill="#0B1F3A" textAnchor="middle">{courseName}</text>
        <text x="340" y="354" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="12" fill="#2f3140" textAnchor="middle">
          {cohortLabel ? `${cohortLabel} cohort · ` : ""}{scoreLine}
        </text>
        <text x="340" y="378" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="11" fill="#5a5040" textAnchor="middle" fontStyle="italic">Awarded with merit on the recommendation of the academic council</text>

        <g transform="translate(120,440)">
          <text x="50" y="-44" fontFamily="var(--font-great-vibes), 'Great Vibes','Snell Roundhand','Apple Chancery','Brush Script MT','Lucida Handwriting',cursive" fontSize="22" fontStyle="italic" fill="#0B1F3A" textAnchor="middle">Vikas Khanduri</text>
          <line x1="-10" y1="-22" x2="110" y2="-22" stroke="#0B1F3A" strokeWidth="0.5" />
          <text x="50" y="-7" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="11" fontWeight="700" fill="#0B1F3A" textAnchor="middle">Vikas Khanduri</text>
          <text x="50" y="6" fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="8.5" fill="#5a5040" textAnchor="middle" letterSpacing="1.5">FACULTY HEAD · CO-FOUNDER</text>
        </g>

        <g transform="translate(510,440)">
          <text x="50" y="-44" fontFamily="var(--font-great-vibes), 'Great Vibes','Snell Roundhand','Apple Chancery','Brush Script MT','Lucida Handwriting',cursive" fontSize="22" fontStyle="italic" fill="#0B1F3A" textAnchor="middle">Aishwarya Singh</text>
          <line x1="-10" y1="-22" x2="110" y2="-22" stroke="#0B1F3A" strokeWidth="0.5" />
          <text x="50" y="-7" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="11" fontWeight="700" fill="#0B1F3A" textAnchor="middle">Aishwarya Singh</text>
          <text x="50" y="6" fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="8.5" fill="#5a5040" textAnchor="middle" letterSpacing="1.5">DIRECTOR · ACADEMICS</text>
        </g>

        <g transform="translate(340,415)">
          <polygon points={SCALLOP_OUTER} fill="#8a6206" opacity="0.45" />
          <polygon points={SCALLOP_OUTER} fill="url(#cert-rainbow)" opacity="0.92" />
          <polygon points={SCALLOP_OUTER} fill="url(#cert-rainbow2)" opacity="0.55" />
          <polygon points={SCALLOP_OUTER} fill="url(#cert-sheen)" opacity="0.6" />
          <polygon points={SCALLOP_OUTER} fill="url(#cert-dome)" opacity="0.9" />
          <polygon points={SCALLOP_INNER} fill="none" stroke="#ffffff" strokeWidth="0.4" opacity="0.45" />
          <circle cx="0" cy="0" r="32" fill="#fefcf6" stroke="#b8860b" strokeWidth="1.0" />
          <circle cx="0" cy="0" r="32" fill="url(#cert-rainbow)" opacity="0.10" />
          <circle cx="0" cy="0" r="27" fill="none" stroke="#b8860b" strokeWidth="0.4" strokeDasharray="1.4 1.6" />
          <circle cx="0" cy="0" r="20" fill="none" stroke="#b8860b" strokeWidth="0.5" />
          <text x="0" y="5" fontFamily="'Libre Caslon Text','Times New Roman',serif" fontSize="16" fontWeight="700" fill="#0B1F3A" textAnchor="middle" letterSpacing="2">VCA</text>
          <line x1="-10" y1="9" x2="10" y2="9" stroke="#b8860b" strokeWidth="0.6" />
          <text fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="5" fill="#0B1F3A" letterSpacing="2.2"><textPath href="#cert-curve-top" startOffset="50%" textAnchor="middle">★ VIVA CAREER ACADEMY ★</textPath></text>
          <text fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="4.6" fill="#0B1F3A" letterSpacing="1.7"><textPath href="#cert-curve-bottom" startOffset="50%" textAnchor="middle">OFFICIAL · VERIFIED ISSUE</textPath></text>
          <ellipse cx="-12" cy="-14" rx="14" ry="6" fill="#ffffff" opacity="0.35" />
          <ellipse cx="12" cy="12" rx="9" ry="3" fill="#ffffff" opacity="0.18" />
        </g>

        <line x1="40" y1="478" x2="640" y2="478" stroke="#d8cfbe" strokeWidth="0.5" />
        <text x="48" y="491" fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="8" fill="#5a5040" letterSpacing="1.5">CERT-ID  {certId}</text>
        <text x="640" y="491" fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="8" fill="#5a5040" textAnchor="end" letterSpacing="1.5">ISSUED  {issuedDate}</text>
        <text x="340" y="505" fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="8" fill="#5a5040" textAnchor="middle" letterSpacing="1.2">VERIFY · {verifyUrl}</text>
      </svg>
    </div>
  );
}
