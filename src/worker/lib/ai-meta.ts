import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

interface MetaInput {
  html: string;
  transcript: string;
  title: string;
}

export interface AiMeta {
  description: string;
  tags: string[];
}

const ALLOWED_TAGS = [
  "resume",
  "report",
  "invoice",
  "letter",
  "deck",
  "brief",
  "proposal",
  "contract",
  "memo",
  "essay",
  "guide",
  "manual",
  "flyer",
  "newsletter",
  "menu",
  "form",
  "agenda",
  "notes",
  "summary",
  "cv",
];

const clipDescription = (raw: string): string => {
  let d = (raw ?? "").trim();
  d = d.replace(/^["'`*_]+|["'`*_]+$/g, "");
  d = d.replace(/^(Description:|Summary:)\s*/i, "");
  d = d.replace(/\s+/g, " ").trim();
  if (d.length > 140) d = d.slice(0, 137).trimEnd() + "…";
  return d;
};

const filterTags = (raw: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const norm = t.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
    if (!norm || seen.has(norm)) continue;
    if (!ALLOWED_TAGS.includes(norm)) continue;
    seen.add(norm);
    out.push(norm);
    if (out.length >= 5) break;
  }
  return out;
};

const PROMPT = (input: MetaInput) => `You write metadata for shared PDFs.

Given the document title, user instructions, and HTML, output STRICT JSON only — no prose, no markdown fence:
{
  "description": "<one short sentence, 80-140 chars, plain text, no quotes, no emojis, ends with a period>",
  "tags": ["<tag>", "<tag>", "<tag>"]
}

Tags MUST be 3-5 lowercase single words from this allow-list ONLY:
${ALLOWED_TAGS.join(", ")}

TITLE: ${input.title}
USER INSTRUCTIONS:
${input.transcript || "(none)"}

DOCUMENT HTML (truncated):
${input.html || "(empty)"}

Output ONLY the JSON object.`;

export const parseJson = (raw: string): AiMeta | null => {
  const text = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]) as { description?: unknown; tags?: unknown };
    const description = clipDescription(typeof obj.description === "string" ? obj.description : "");
    const tags = Array.isArray(obj.tags)
      ? filterTags(obj.tags.filter((t): t is string => typeof t === "string"))
      : [];
    if (description.length < 10) return null;
    return { description, tags };
  } catch {
    return null;
  }
};

const tryWorkersAi = async (env: Env, input: MetaInput): Promise<AiMeta | null> => {
  try {
    const res = (await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: "You output strict JSON only. No prose, no markdown fence." },
        { role: "user", content: PROMPT(input) },
      ],
      max_tokens: 220,
      temperature: 0.2,
    })) as { response?: string };
    return parseJson(res?.response ?? "");
  } catch {
    return null;
  }
};

const tryAnthropic = async (env: Env, input: MetaInput): Promise<AiMeta | null> => {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 260,
        temperature: 0.2,
        messages: [{ role: "user", content: PROMPT(input) }],
      },
      { timeout: 15000 }
    );
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ");
    return parseJson(text);
  } catch {
    return null;
  }
};

export const generateAiMeta = async (env: Env, input: MetaInput): Promise<AiMeta> => {
  const cf = await tryWorkersAi(env, input);
  if (cf) return cf;
  const anth = await tryAnthropic(env, input);
  if (anth) return anth;
  return { description: "", tags: [] };
};

export { ALLOWED_TAGS };
