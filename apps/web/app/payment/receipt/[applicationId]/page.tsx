import Link from "next/link";

import { PaymentReceipt } from "../../../../components/payment-receipt";
import { SiteShell } from "../../../../components/site-shell";

export default async function PaymentReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { applicationId } = await params;
  const { tenant } = await searchParams;

  return (
    <SiteShell
      activeHref="/admissions"
      eyebrow="Receipt"
      title="Every application should have a clear payment and enrollment audit trail."
      description="This receipt page is the applicant-facing proof layer for payment, program, and enrollment status."
      primaryCta={{ label: "Return to admissions", href: "/admissions" }}
      secondaryCta={{ label: "Open student workspace", href: "/student" }}
    >
      <PaymentReceipt applicationId={applicationId} tenantName={tenant} />
      <section className="card">
        <div className="eyebrow">Next step</div>
        <p className="muted" style={{ marginTop: 12 }}>
          After payment, the ideal flow is classroom onboarding, schedule visibility, and first-session reminders without any manual chasing.
        </p>
        <div className="button-row">
          <Link href="/messages" className="button-secondary">Open messaging center</Link>
        </div>
      </section>
    </SiteShell>
  );
}
