import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

interface TitleInput {
  html: string;
  transcript: string;
  currentTitle: string;
}

const FALLBACK = "Untitled PDF";

const cleanTitle = (raw: string): string => {
  let t = (raw ?? "").trim();
  t = t.replace(/^["'`*_]+|["'`*_]+$/g, "");
  t = t.replace(/^(Title:|Document:|PDF:)\s*/i, "");
  t = t.replace(/\s+/g, " ").trim();
  if (t.length > 60) t = t.slice(0, 57).trimEnd() + "…";
  return t;
};

const PROMPT = (input: TitleInput) => `You name PDF documents.

Given the user's instructions and the current HTML, output exactly one short, clear, human-readable title for this document. 4-8 words. Title Case. No quotes. No "Document:" or "Title:" prefix. No emojis. No trailing punctuation.

USER INSTRUCTIONS (conversation transcript):
${input.transcript || "(none yet)"}

DOCUMENT HTML (truncated):
${input.html || "(empty)"}

CURRENT TITLE: ${input.currentTitle}

Output ONLY the new title, nothing else.`;

const tryWorkersAi = async (env: Env, input: TitleInput): Promise<string | null> => {
  try {
    const res = (await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: "You generate concise document titles. Respond with only the title text." },
        { role: "user", content: PROMPT(input) },
      ],
      max_tokens: 40,
      temperature: 0.2,
    })) as { response?: string };
    const out = cleanTitle(res?.response ?? "");
    return out.length >= 3 ? out : null;
  } catch {
    return null;
  }
};

const tryAnthropic = async (env: Env, input: TitleInput): Promise<string | null> => {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        temperature: 0.2,
        messages: [{ role: "user", content: PROMPT(input) }],
      },
      { timeout: 15000 }
    );
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ");
    const out = cleanTitle(text);
    return out.length >= 3 ? out : null;
  } catch {
    return null;
  }
};

export const generateAiTitle = async (env: Env, input: TitleInput): Promise<string> => {
  const cf = await tryWorkersAi(env, input);
  if (cf) return cf;
  const anth = await tryAnthropic(env, input);
  if (anth) return anth;
  return input.currentTitle && input.currentTitle !== "Untitled PDF" ? input.currentTitle : FALLBACK;
};
