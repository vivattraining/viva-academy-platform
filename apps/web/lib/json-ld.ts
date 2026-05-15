/**
 * Safe JSON-LD serialiser for inline <script type="application/ld+json">
 * blocks. Closes audit row H-F2 (16 May 2026).
 *
 * Plain JSON.stringify does NOT escape `<`, `>` or `&`. When the data
 * contains admin-editable strings (e.g. course.name in the JSON-LD on
 * /courses/[code]), an admin who types "</script><script>x</script>"
 * lands raw HTML on a public page = stored XSS.
 *
 * Encodes the four sequences that can break out of a <script> context
 * plus the two Unicode line separators (U+2028, U+2029) that JSON
 * technically permits but JavaScript forbids inside string literals.
 * The regex literals below use the 6-char Unicode escape form
 * (backslash-u-2-0-2-8) — embedding the literal chars in source would
 * terminate the regex token because they are LineTerminator in JS.
 *
 * Usage:
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
 *   />
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
