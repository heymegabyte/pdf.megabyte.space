import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

export type BlockKind =
  | "cover"
  | "toc"
  | "signature"
  | "references"
  | "cta"
  | "executive-summary"
  | "thank-you"
  | "divider";

export const ALLOWED_BLOCK_KINDS: BlockKind[] = [
  "cover",
  "toc",
  "signature",
  "references",
  "cta",
  "executive-summary",
  "thank-you",
  "divider",
];

interface BlockInput {
  kind: BlockKind;
  title: string;
  currentHtml: string;
  context?: string;
}

const BLOCK_GUIDANCE: Record<BlockKind, string> = {
  cover:
    "Full-page cover with large document title, optional subtitle line, author name, and a small date in lower-right. Centered vertically. No images.",
  toc:
    "Table of Contents — list of H2 headings discovered in CURRENT HTML, each with dot leader and (placeholder) page number. Heading 'Contents' at top.",
  signature:
    "Signature block — two side-by-side signature lines with printed name + title + date underneath. Use a flex container with two equal columns. No image.",
  references:
    "References / bibliography section — heading 'References', then an ordered list of 3 placeholder APA-style entries with hanging indent.",
  cta:
    "Call-to-action banner — bordered box with bold headline (e.g. 'Next steps'), one supporting paragraph, and a styled link/button reading 'Get in touch'. Use accent color sparingly.",
  "executive-summary":
    "Executive summary section — heading 'Executive Summary', followed by 3 short paragraphs and a 3-bullet 'Key findings' list.",
  "thank-you":
    "Thank-you closing page — centered 'Thank you.' heading at large size, short two-line gratitude paragraph, optional contact line in muted color.",
  divider:
    "Visual divider — horizontal rule with a small centered diamond or three dots, used to separate sections. Minimal markup.",
};

const PROMPT = (input: BlockInput) => `You are inserting a single new <section> block into an existing PDF document.

BLOCK KIND: ${input.kind}
GUIDANCE: ${BLOCK_GUIDANCE[input.kind]}

DOCUMENT TITLE: ${input.title}
USER CONTEXT: ${input.context || "(none)"}

CURRENT DOCUMENT HTML (truncated, for reference only — do NOT rewrite it):
${input.currentHtml.slice(0, 6000)}

REQUIREMENTS:
- Output ONLY a single HTML <section>...</section> element with semantic markup. No <html>, <head>, <body>, <script>, <style>.
- Inline minimal style attributes when needed (font-size, font-weight, color, margin, padding). Prefer reusing the document's existing look — assume body font is system-ui sans-serif.
- Keep accent color cyan-blue (#0ea5e9 or similar) — do NOT introduce branded colors.
- Use page-break-before:always on the section's outer style if it should start on a fresh page (cover, thank-you).
- No external resources (no fonts, no images, no scripts).
- Plain text content where placeholder copy is needed — short, in the voice of a generic professional document.

Output the <section>...</section> markup ONLY. Nothing before, nothing after.`;

export const extractSection = (raw: string): string | null => {
  const text = raw.trim().replace(/^```(?:html)?\s*|\s*```$/g, "");
  const m = text.match(/<section[\s\S]*?<\/section>/i);
  return m ? m[0].trim() : null;
};

const tryAnthropic = async (env: Env, input: BlockInput): Promise<string | null> => {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        temperature: 0.4,
        messages: [{ role: "user", content: PROMPT(input) }],
      },
      { timeout: 20000 }
    );
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return extractSection(text);
  } catch {
    return null;
  }
};

export const generateAiBlock = async (env: Env, input: BlockInput): Promise<string | null> => {
  return tryAnthropic(env, input);
};
