export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function useApi() {
  return async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  };
}

export function useAuthFetch() {
  return async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(path, { credentials: "include", ...init });
  };
}
