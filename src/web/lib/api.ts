export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Module-level singletons. These are stateless — no hook context needed,
// no closure over render scope — so we hand back the SAME function reference
// on every render. Returning a fresh inner function via `useApi()` was a
// bug: any component putting `api` into a useEffect deps array re-fired the
// effect on every render → state update → re-render → new fn → loop, which
// hammered `/api/explore?...` and `/api/explore/tags` until Chrome ran out
// of sockets and started returning ERR_INSUFFICIENT_RESOURCES.
async function apiFn<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { credentials: "include", ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

async function authFetchFn(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(path, { credentials: "include", ...init });
}

export function useApi() {
  return apiFn;
}

export function useAuthFetch() {
  return authFetchFn;
}
