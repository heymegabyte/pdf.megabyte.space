#!/usr/bin/env node
/**
 * Pushes the 14 canonical transactional templates into Listmonk.
 *
 * Each emails/NN-alias.html file is split on the literal '---' line into:
 *   - top: JSON metadata { alias, subject, preheader }
 *   - bottom: HTML content block
 * The content block is spliced into emails/_layout.html at the
 * `<!-- CONTENT -->` placeholder and the result is shipped via
 * Listmonk's /api/tx/templates endpoint (create or update by name).
 *
 * Env:
 *   LISTMONK_BASE_URL    e.g. https://listmonk.megabyte.space
 *   LISTMONK_API_USER    API-user handle from Listmonk → Settings → Users
 *   LISTMONK_API_TOKEN   API key paired with that user (Listmonk 3.x)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAILS_DIR = path.join(__dirname, "..", "emails");

const REAL_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const BASE_URL = process.env.LISTMONK_BASE_URL;
const API_USER = process.env.LISTMONK_API_USER;
const API_TOKEN = process.env.LISTMONK_API_TOKEN;

if (!BASE_URL || !API_USER || !API_TOKEN) {
  console.error("Missing LISTMONK_BASE_URL / LISTMONK_API_USER / LISTMONK_API_TOKEN");
  process.exit(1);
}

const auth = `token ${API_USER}:${API_TOKEN}`;

const headers = {
  "User-Agent": REAL_UA,
  Authorization: auth,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function fetchTemplates() {
  const res = await fetch(`${BASE_URL}/api/templates?per_page=200`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status} ${await res.text()}`);
  const json = await res.json();
  // Listmonk 3.x returns `data` as a direct array for /api/templates,
  // but `data.results` for paginated endpoints — accept both shapes.
  if (Array.isArray(json.data)) return json.data;
  return json.data?.results ?? [];
}

async function upsertTemplate(name, subject, body) {
  const existing = await fetchTemplates();
  const match = existing.find((t) => t.name === name);
  const payload = {
    name,
    type: "tx",
    subject,
    body,
    // Listmonk persists this field across PUTs — must set explicitly to "html"
    // or it falls back to "richtext" and tries to JSON-parse the body as
    // visual-editor state, which breaks raw HTML templates with a misleading
    // "globals.messages.errorFetching: Invalid arguments" at send time.
    body_source: "html",
  };
  const url = match
    ? `${BASE_URL}/api/templates/${match.id}`
    : `${BASE_URL}/api/templates`;
  const method = match ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed ${method} ${name}: ${res.status} ${await res.text()}`);
  }
  return { name, action: match ? "updated" : "created" };
}

function loadLayout() {
  return fs.readFileSync(path.join(EMAILS_DIR, "_layout.html"), "utf8");
}

function splitTemplateFile(content) {
  const sep = content.indexOf("\n---\n");
  if (sep === -1) throw new Error("Missing --- separator");
  const meta = JSON.parse(content.slice(0, sep).trim());
  const body = content.slice(sep + 5);
  return { meta, body };
}

function buildHtml(layout, body, preheader) {
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;visibility:hidden;">${preheader}</div>\n`
    : "";
  return layout.replace(
    "<!-- CONTENT -->",
    preheaderBlock + body + "\n"
  );
}

async function main() {
  const layout = loadLayout();
  const files = fs
    .readdirSync(EMAILS_DIR)
    .filter((f) => /^\d{2}-.+\.html$/.test(f))
    .sort();

  console.log(`Syncing ${files.length} templates → ${BASE_URL}`);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(EMAILS_DIR, file), "utf8");
    const { meta, body } = splitTemplateFile(raw);
    const html = buildHtml(layout, body, meta.preheader);
    try {
      const result = await upsertTemplate(meta.alias, meta.subject, html);
      console.log(`  ${result.action.padEnd(8)} ${meta.alias}`);
    } catch (err) {
      console.error(`  FAILED ${meta.alias}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log("\nDone. Verify in Listmonk: " + BASE_URL + "/admin/campaigns/templates");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
