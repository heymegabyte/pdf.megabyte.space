/**
 * Shared XML/SVG escape + text-wrap helpers for the feed handlers and the
 * SVG OG card. Kept dependency-free so they're trivially unit-testable.
 */

/**
 * Escapes the five XML metacharacters (`<`, `>`, `&`, `'`, `"`).
 * Safe to use as the inner content of an element OR as the value of a
 * double-quoted attribute.
 */
export const xmlEscape = (s: string): string =>
  s.replace(/[<>&'"]/g, (ch) =>
    ch === "<"
      ? "&lt;"
      : ch === ">"
        ? "&gt;"
        : ch === "&"
          ? "&amp;"
          : ch === "'"
            ? "&apos;"
            : "&quot;"
  );

/**
 * Alias of {@link xmlEscape}, exported for call-site clarity in SVG contexts
 * where the same escaping rules apply.
 */
export const svgEscape = xmlEscape;

/**
 * Greedy word-wrapper used by the SVG OG card. Splits `text` on whitespace,
 * packs words into up to `maxLines` lines of at most `maxChars` each, and
 * appends an ellipsis to the last line if more words would have followed.
 */
export const wrapWords = (
  text: string,
  maxChars: number,
  maxLines: number
): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    if (last) lines[lines.length - 1] = last.replace(/.{1,3}$/, "…");
  }
  return lines;
};
