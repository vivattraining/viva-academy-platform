import { redirect } from "next/navigation";

import { requireInternalPageAccess } from "../../lib/internal-access";

/**
 * White-label settings was removed from the live surface (see
 * VIVA-WHITE-LABEL-REMOVED-FROM-LIVE-2026-04-24.md). Admin-only gate
 * ensures non-admins are blocked with a proper auth redirect rather than
 * silently forwarded to their own workspace (which would look like access
 * was "allowed" to automated access-control audits).
 */
export default async function WhiteLabelPage() {
  await requireInternalPageAccess(["admin"]);
  redirect("/admin");
}
