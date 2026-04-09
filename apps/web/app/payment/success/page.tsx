import { PaymentSuccessPanel } from "../../../components/payment-success-panel";
import { SiteShell } from "../../../components/site-shell";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; applicationId?: string; token?: string }>;
}) {
  const params = await searchParams;
  const tenant = params.tenant || "VIVA Training Institute";
  const applicationId = params.applicationId || "";
  const token = params.token || "";

  return (
    <SiteShell
      activeHref="/admissions"
      eyebrow="Payment confirmation"
      title="A successful payment should immediately advance the learner into the next stage."
      description="This page closes the loop between admissions, payment, and enrollment so VIVA does not lose applicants after checkout."
    >
      <PaymentSuccessPanel tenant={tenant} applicationId={applicationId} token={token} />
    </SiteShell>
  );
}
