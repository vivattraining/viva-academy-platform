import { PaymentFailedPanel } from "../../../components/payment-failed-panel";
import { SiteShell } from "../../../components/site-shell";

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const params = await searchParams;

  return (
    <SiteShell
      activeHref="/admissions"
      eyebrow="Payment recovery"
      title="When payment fails, the application should remain recoverable and visible."
      description="This recovery surface prevents applicants from falling out of the funnel and gives operators a clear handoff back into admissions."
    >
      <PaymentFailedPanel applicationId={params.applicationId || ""} />
    </SiteShell>
  );
}
