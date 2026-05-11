import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

interface PrettierInput {
  html: string;
  css: string;
  title: string;
}

export interface AiPrettierResult {
  html: string;
  css: string;
}

const extractCodeBlock = (text: string, lang: string): string | null => {
  const fence = new RegExp("```" + lang + "\\s*([\\s\\S]*?)```", "i");
  const m = text.match(fence);
  return m && m[1] ? m[1].trim() : null;
};

export const parsePrettierOutput = (raw: string): AiPrettierResult | null => {
  const html = extractCodeBlock(raw, "html");
  const css = extractCodeBlock(raw, "css");
  if (!html && !css) return null;
  return {
    html: (html ?? "").trim(),
    css: (css ?? "").trim(),
  };
};

const PROMPT = (input: PrettierInput) => `You are a senior typographer + visual designer rewriting a PDF document to look beautiful when printed at Letter/A4.

INSTRUCTIONS:
- Keep ALL existing text content and structure. Do not invent new sections. Do not remove sections.
- Improve typography: comfortable line-height (1.5-1.65 for body), tighter headings (1.1-1.25), generous margins, balanced text-wrap, hyphenation hints.
- Improve hierarchy: distinct H1/H2/H3 scale (1.875rem/1.5rem/1.25rem reference), restrained accent color usage, clean rules between sections.
- Improve color: max 2 accent colors + neutrals. No gradients on text. Use #0f172a body, #475569 muted, one cool accent like #0ea5e9.
- Improve spacing: section padding 1.5-2rem, paragraph margins 0.75-1rem.
- Keep the CSS print-safe: avoid \`position:fixed\`, avoid huge images, use \`@page\` rules sparingly, avoid \`prefers-color-scheme\` overrides.
- Avoid web fonts (use system font stack: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif).

CURRENT TITLE: ${input.title}

CURRENT HTML:
\`\`\`html
${input.html.slice(0, 12000)}
\`\`\`

CURRENT CSS:
\`\`\`css
${input.css.slice(0, 6000)}
\`\`\`

Output EXACTLY two fenced code blocks in this order — no prose before or between:

\`\`\`html
<rewritten html here>
\`\`\`

\`\`\`css
<rewritten css here>
\`\`\``;

const tryAnthropic = async (env: Env, input: PrettierInput): Promise<AiPrettierResult | null> => {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{ role: "user", content: PROMPT(input) }],
      },
      { timeout: 45000 }
    );
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const parsed = parsePrettierOutput(text);
    if (!parsed) return null;
    return {
      html: parsed.html || input.html,
      css: parsed.css || input.css,
    };
  } catch {
    return null;
  }
};

export const generateAiPrettier = async (
  env: Env,
  input: PrettierInput
): Promise<AiPrettierResult | null> => {
  return tryAnthropic(env, input);
};
