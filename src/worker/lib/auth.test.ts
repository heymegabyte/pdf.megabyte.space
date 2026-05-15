import { describe, expect, it } from "vitest";

import {
  b64urlDecode,
  b64urlEncode,
  buildSessionCookie,
  clearSessionCookie,
  generatePkce,
  parseCookies,
  randomId,
  sha256,
  signSession,
  SESSION_COOKIE,
  timingSafeEqual,
  verifySessionCookie,
} from "./auth";

const SECRET = "test-secret-do-not-use-in-prod";

describe("b64url encode/decode", () => {
  it("round-trips arbitrary bytes", () => {
    const input = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const encoded = b64urlEncode(input);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    expect(b64urlDecode(encoded)).toEqual(input);
  });

  it("encodes empty input to empty string", () => {
    expect(b64urlEncode(new Uint8Array(0))).toBe("");
    expect(b64urlDecode("")).toEqual(new Uint8Array(0));
  });

  it("accepts both Uint8Array and ArrayBuffer", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(b64urlEncode(bytes)).toBe(b64urlEncode(bytes.buffer));
  });
});

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("hello", "hello")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(timingSafeEqual("hello", "world")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqual("a", "ab")).toBe(false);
    expect(timingSafeEqual("ab", "a")).toBe(false);
  });

  it("handles empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("randomId", () => {
  it("produces 256 bits of entropy by default (b64url ~43 chars)", () => {
    const id = randomId();
    expect(id.length).toBeGreaterThanOrEqual(40);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces unique ids", () => {
    const a = randomId();
    const b = randomId();
    expect(a).not.toBe(b);
  });

  it("respects custom byte length", () => {
    const short = randomId(8);
    expect(short.length).toBeGreaterThanOrEqual(10);
    expect(short.length).toBeLessThan(20);
  });
});

describe("signSession / verifySessionCookie", () => {
  it("round-trips a valid session", async () => {
    const sessionId = randomId(32);
    const cookie = await signSession(sessionId, SECRET);
    const verified = await verifySessionCookie(cookie, SECRET);
    expect(verified).toBe(sessionId);
  });

  it("rejects a tampered signature", async () => {
    const sessionId = randomId(32);
    const cookie = await signSession(sessionId, SECRET);
    const tampered = `${cookie.slice(0, -2)}xx`;
    expect(await verifySessionCookie(tampered, SECRET)).toBeNull();
  });

  it("rejects a tampered session id (different signature now expected)", async () => {
    const cookie = await signSession("session-a", SECRET);
    const idx = cookie.lastIndexOf(".");
    const tampered = `session-b${cookie.slice(idx)}`;
    expect(await verifySessionCookie(tampered, SECRET)).toBeNull();
  });

  it("rejects when signed with a different secret", async () => {
    const cookie = await signSession("sid-1", SECRET);
    expect(await verifySessionCookie(cookie, "different-secret")).toBeNull();
  });

  it("returns null on missing signature separator", async () => {
    expect(await verifySessionCookie("nodotinhere", SECRET)).toBeNull();
  });

  it("returns null on empty / leading-dot input", async () => {
    expect(await verifySessionCookie("", SECRET)).toBeNull();
    expect(await verifySessionCookie(".abc", SECRET)).toBeNull();
  });
});

describe("buildSessionCookie", () => {
  it("emits sensible defaults for production", () => {
    const c = buildSessionCookie("abc.sig");
    expect(c).toContain(`${SESSION_COOKIE}=abc.sig`);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("SameSite=Lax");
    expect(c).toContain("Secure");
    expect(c).toContain("Path=/");
  });

  it("includes Max-Age when provided", () => {
    expect(buildSessionCookie("v", { maxAgeSec: 1000 })).toContain("Max-Age=1000");
  });

  it("omits Secure when explicitly disabled (local dev only)", () => {
    expect(buildSessionCookie("v", { secure: false })).not.toContain("Secure");
  });
});

describe("clearSessionCookie", () => {
  it("emits Max-Age=0 to remove the cookie", () => {
    const c = clearSessionCookie();
    expect(c).toContain(`${SESSION_COOKIE}=`);
    expect(c).toContain("Max-Age=0");
    expect(c).toContain("HttpOnly");
  });
});

describe("parseCookies", () => {
  it("parses a basic single cookie header", () => {
    expect(parseCookies("a=1")).toEqual({ a: "1" });
  });

  it("parses multiple cookies with whitespace", () => {
    expect(parseCookies("a=1; b=2; c=hello")).toEqual({ a: "1", b: "2", c: "hello" });
  });

  it("URI-decodes values", () => {
    expect(parseCookies("u=hello%20world")).toEqual({ u: "hello world" });
  });

  it("handles missing or empty headers", () => {
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies("")).toEqual({});
  });

  it("preserves values that contain '=' characters", () => {
    expect(parseCookies("token=abc=def=ghi")).toEqual({ token: "abc=def=ghi" });
  });
});

describe("sha256", () => {
  it("produces a stable 256-bit b64url digest", async () => {
    // Known SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    // b64url-encoded (no padding) = ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0
    expect(await sha256("abc")).toBe("ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0");
  });

  it("differs for different inputs", async () => {
    expect(await sha256("a")).not.toBe(await sha256("b"));
  });
});

describe("generatePkce", () => {
  it("returns a verifier+challenge pair whose challenge = SHA-256(verifier)", async () => {
    const { verifier, challenge } = await generatePkce();
    expect(verifier.length).toBeGreaterThan(0);
    expect(challenge.length).toBeGreaterThan(0);
    expect(challenge).toBe(await sha256(verifier));
  });

  it("produces unique pairs", async () => {
    const a = await generatePkce();
    const b = await generatePkce();
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.challenge).not.toBe(b.challenge);
  });

  it("verifier is URL-safe (no padding, no +//=)", async () => {
    const { verifier } = await generatePkce();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
