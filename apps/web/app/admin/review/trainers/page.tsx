import { SiteShell } from "../../../../components/site-shell";
import { InternalRouteGate } from "../../../../components/internal-route-gate";
import { AdminTrainerReviewWorkspace } from "../../../../components/admin-trainer-review-workspace";
import { requireInternalPageAccess } from "../../../../lib/internal-access";

export default async function AdminTrainerReviewPage() {
  await requireInternalPageAccess(["admin", "operations"]);

  return (
    <SiteShell
      activeHref="/admin/review/trainers"
      eyebrow="Trainer review"
      title="Approve trainer profiles before they appear on the public site."
      description="Pending profiles, changes requested, and approved trainers — managed in one queue."
      primaryCta={{ label: "Send invite", href: "/admin/invites" }}
      secondaryCta={{ label: "Back to admin", href: "/admin" }}
      navVariant="internal"
    >
      <InternalRouteGate allowedRoles={["admin", "operations"]}>
        <AdminTrainerReviewWorkspace />
      </InternalRouteGate>
    </SiteShell>
  );
}
