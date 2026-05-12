import type { Env } from "../types";

/**
 * Listmonk client. Uses Basic Auth against the transactional API.
 * Docs: https://listmonk.app/docs/apis/transactional/
 */

export interface ListmonkSendArgs {
  subscriberEmail: string;
  templateAlias: string;
  data: Record<string, unknown>;
  headers?: Record<string, string>;
  contentType?: "html" | "markdown" | "plain";
  fromEmail?: string;
}

export interface ListmonkResponse {
  ok: boolean;
  status: number;
  body?: unknown;
  error?: string;
  messageId?: string;
}

/**
 * Listmonk 3.x API user auth: `Authorization: token <user>:<key>`.
 * The legacy Basic-Auth path was deprecated in favor of scoped API users.
 */
const auth = (env: Env): string =>
  `token ${env.LISTMONK_API_USER ?? ""}:${env.LISTMONK_API_TOKEN ?? ""}`;

const REAL_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function listmonkConfigured(env: Env): boolean {
  return Boolean(env.LISTMONK_BASE_URL && env.LISTMONK_API_USER && env.LISTMONK_API_TOKEN);
}

/**
 * Resolve a template name (the alias we use in code) to its numeric Listmonk id.
 * Listmonk's /api/tx demands an int — we cache the name→id map in KV for 1 day
 * and rebuild lazily on miss. The sync script populates the names; lookups are
 * cheap once the map is warm.
 */
const TPL_CACHE_KEY = "listmonk:tpl:v1";
const TPL_CACHE_TTL = 86400;

async function loadTemplateMap(env: Env): Promise<Record<string, number>> {
  const cached = await env.CACHE.get(TPL_CACHE_KEY, "json").catch(() => null);
  if (cached && typeof cached === "object") return cached as Record<string, number>;
  const base = env.LISTMONK_BASE_URL!.replace(/\/+$/, "");
  const res = await fetch(`${base}/api/templates?per_page=200`, {
    headers: { authorization: auth(env), "user-agent": REAL_UA, accept: "application/json" },
  });
  if (!res.ok) return {};
  const json = (await res.json()) as { data?: Array<{ id: number; name: string; type: string }> };
  const map: Record<string, number> = {};
  for (const t of json.data ?? []) {
    if (t.type === "tx") map[t.name] = t.id;
  }
  await env.CACHE.put(TPL_CACHE_KEY, JSON.stringify(map), { expirationTtl: TPL_CACHE_TTL }).catch(() => {});
  return map;
}

async function resolveTemplateId(env: Env, alias: string): Promise<number | null> {
  let map = await loadTemplateMap(env);
  if (map[alias]) return map[alias];
  // Cache miss for this alias — bust cache once and retry in case sync ran recently.
  await env.CACHE.delete(TPL_CACHE_KEY).catch(() => {});
  map = await loadTemplateMap(env);
  return map[alias] ?? null;
}

/**
 * Send a transactional email via Listmonk. Resolves a subscriber by email
 * (`subscriber_email`), renders the named template alias with `data`, and
 * returns the message id on success.
 */
export async function listmonkSendTx(
  env: Env,
  args: ListmonkSendArgs
): Promise<ListmonkResponse> {
  if (!listmonkConfigured(env)) {
    return { ok: false, status: 0, error: "Listmonk not configured" };
  }
  const base = env.LISTMONK_BASE_URL!.replace(/\/+$/, "");
  const templateId = await resolveTemplateId(env, args.templateAlias);
  if (!templateId) {
    return { ok: false, status: 0, error: `template_not_found:${args.templateAlias}` };
  }
  const headersArr = Object.entries(args.headers ?? {}).map(([k, v]) => ({ [k]: v }));
  const body: Record<string, unknown> = {
    subscriber_email: args.subscriberEmail,
    template_id: templateId,
    data: args.data,
    headers: headersArr,
    content_type: args.contentType ?? "html",
    messenger: "email",
  };
  if (args.fromEmail || env.LISTMONK_FROM_EMAIL) {
    body.from_email = args.fromEmail ?? env.LISTMONK_FROM_EMAIL;
  }
  const post = async (): Promise<Response> =>
    fetch(`${base}/api/tx`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth(env),
        "user-agent": REAL_UA,
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

  let res: Response;
  try {
    res = await post();
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // non-json response (rare)
  }

  // Listmonk rejects with HTTP 400 + "Subscriber ... not found" when the recipient
  // hasn't been imported yet. Auto-upsert and retry once — the welcome email is the
  // first signal we have for a brand-new user, so we want it to land regardless.
  const msg =
    typeof json === "object" && json && "message" in json
      ? String((json as { message: unknown }).message)
      : "";
  if (!res.ok && /not found/i.test(msg) && res.status === 400) {
    await listmonkUpsertSubscriber(env, {
      email: args.subscriberEmail,
      name: typeof (args.data as { user?: { name?: string } })?.user?.name === "string"
        ? (args.data as { user: { name: string } }).user.name
        : undefined,
    });
    try {
      res = await post();
      json = await res.json().catch(() => null);
    } catch (err) {
      return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (!res.ok) {
    const errMsg =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : `HTTP ${res.status} ${JSON.stringify(json).slice(0, 500)}`;
    return { ok: false, status: res.status, body: json, error: errMsg };
  }
  return { ok: true, status: res.status, body: json };
}

export interface ListmonkSubscriberArgs {
  email: string;
  name?: string;
  attribs?: Record<string, unknown>;
  listIds?: number[];
}

/**
 * Upsert a subscriber. Idempotent — creates if missing, updates attribs if present.
 * Used to sync newly signed-up users into the broadcast list so weekly digest
 * campaigns can target them.
 */
export async function listmonkUpsertSubscriber(
  env: Env,
  args: ListmonkSubscriberArgs
): Promise<ListmonkResponse> {
  if (!listmonkConfigured(env)) {
    return { ok: false, status: 0, error: "Listmonk not configured" };
  }
  const base = env.LISTMONK_BASE_URL!.replace(/\/+$/, "");
  const lists = args.listIds ?? (env.LISTMONK_LIST_ID ? [Number(env.LISTMONK_LIST_ID)] : []);
  const body = {
    email: args.email,
    name: args.name ?? args.email.split("@")[0],
    status: "enabled" as const,
    lists,
    attribs: args.attribs ?? {},
    preconfirm_subscriptions: true,
  };
  const res = await fetch(`${base}/api/subscribers`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: auth(env),
      "user-agent": REAL_UA,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 409) {
    // Already exists — patch attribs by email
    const search = new URL(`${base}/api/subscribers`);
    search.searchParams.set("query", `subscribers.email = '${args.email.replace(/'/g, "''")}'`);
    const lookup = await fetch(search.toString(), {
      headers: { authorization: auth(env), "user-agent": REAL_UA },
    });
    if (!lookup.ok) return { ok: false, status: lookup.status, error: "lookup_failed" };
    const lookupJson = (await lookup.json()) as {
      data?: { results?: Array<{ id: number }> };
    };
    const id = lookupJson.data?.results?.[0]?.id;
    if (!id) return { ok: false, status: 404, error: "subscriber_not_found_after_409" };
    const patch = await fetch(`${base}/api/subscribers/${id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: auth(env),
        "user-agent": REAL_UA,
      },
      body: JSON.stringify({ ...body, id }),
    });
    return { ok: patch.ok, status: patch.status };
  }
  return { ok: res.ok, status: res.status };
}

/**
 * Block a subscriber so no further transactional or campaign mail reaches them.
 * Called from the public unsubscribe endpoint.
 */
export async function listmonkBlocklistByEmail(env: Env, email: string): Promise<ListmonkResponse> {
  if (!listmonkConfigured(env)) return { ok: false, status: 0, error: "Listmonk not configured" };
  const base = env.LISTMONK_BASE_URL!.replace(/\/+$/, "");
  const search = new URL(`${base}/api/subscribers`);
  search.searchParams.set("query", `subscribers.email = '${email.replace(/'/g, "''")}'`);
  const lookup = await fetch(search.toString(), {
    headers: { authorization: auth(env), "user-agent": REAL_UA },
  });
  if (!lookup.ok) return { ok: false, status: lookup.status, error: "lookup_failed" };
  const lookupJson = (await lookup.json()) as {
    data?: { results?: Array<{ id: number }> };
  };
  const id = lookupJson.data?.results?.[0]?.id;
  if (!id) return { ok: true, status: 200 };
  const block = await fetch(`${base}/api/subscribers/${id}/blocklist`, {
    method: "PUT",
    headers: { authorization: auth(env), "user-agent": REAL_UA },
  });
  return { ok: block.ok, status: block.status };
}
