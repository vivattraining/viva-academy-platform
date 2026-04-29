/**
 * Convert raw API enum strings to human-readable labels.
 *
 * The academy API returns operational state as snake_case strings (e.g.
 * "payment_pending", "not_started", "verification_pending"). When those
 * are rendered straight into the UI — as we did inside admissions chips,
 * operations attendance status, etc. — the underscore reads as a
 * formatting artefact to non-engineers.
 *
 * `humanize("payment_pending")` → "Payment pending"
 * `humanize("verification_pending")` → "Verification pending"
 * `humanize("paid")` → "Paid"
 *
 * Returns the input unchanged for null/undefined/empty so call-sites
 * can stay short:
 *
 *   <span>{humanize(item.payment_stage)}</span>
 */
export function humanize(value: string | null | undefined): string {
  if (!value) return "";
  // Handle both snake_case and kebab-case inputs.
  const spaced = value.replace(/[_-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
