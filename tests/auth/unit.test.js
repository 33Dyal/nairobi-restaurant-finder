import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { hashToken, randomToken } from "@/lib/auth/crypto";
import { rateLimit, resetRateLimits } from "@/lib/auth/rate-limit";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { safeNext } from "@/lib/utils/redirect";
import { registerSchema, registerFormSchema, passwordSchema, emailSchema, loginSchema } from "@/lib/validation/auth";

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("Sup3rSecret");
    expect(hash).not.toContain("Sup3rSecret");
    expect(await verifyPassword("Sup3rSecret", hash)).toBe(true);
    expect(await verifyPassword("wrong-pass1", hash)).toBe(false);
  });
});

describe("jwt", () => {
  it("round-trips an access token", async () => {
    const token = await signAccessToken({ sub: "u1", role: "ADMIN" });
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe("u1");
    expect(payload.role).toBe("ADMIN");
  });
  it("rejects an expired token", async () => {
    expect(await verifyAccessToken(await signAccessToken({ sub: "u1", role: "CUSTOMER" }, -60))).toBeNull();
  });
  it("rejects a tampered token", async () => {
    const token = await signAccessToken({ sub: "u1", role: "CUSTOMER" });
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u1", role: "ADMIN", iss: "nairobi-eats", aud: "access", exp: 9999999999 })).toString("base64url");
    expect(await verifyAccessToken(`${h}.${forged}.${s}`)).toBeNull();
  });
  it("does not accept a refresh token as an access token (or the reverse)", async () => {
    const refresh = await signRefreshToken({ sub: "u1", fid: "f", jti: "j" });
    const access = await signAccessToken({ sub: "u1", role: "CUSTOMER" });
    expect(await verifyAccessToken(refresh)).toBeNull();
    expect(await verifyRefreshToken(access)).toBeNull();
    expect((await verifyRefreshToken(refresh)).fid).toBe("f");
  });
});

describe("token hashing", () => {
  it("is deterministic and random tokens are unique", () => {
    expect(hashToken("a")).toBe(hashToken("a"));
    expect(randomToken()).not.toBe(randomToken());
    expect(randomToken().length).toBeGreaterThan(30);
  });
});

describe("rate limit", () => {
  it("blocks after the limit and reports retry time", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 60000).ok).toBe(true);
    const blocked = rateLimit("k", 3, 60000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(rateLimit("other", 3, 60000).ok).toBe(true);
  });
});

describe("csrf origin check", () => {
  const req = (headers, method = "POST") => new Request("http://localhost:3000/api/auth/login", { method, headers });
  it("allows same-origin and non-browser requests", () => {
    expect(() => assertSameOrigin(req({ origin: "http://localhost:3000" }))).not.toThrow();
    expect(() => assertSameOrigin(req({}))).not.toThrow();
  });
  it("blocks foreign origins and cross-site fetches", () => {
    expect(() => assertSameOrigin(req({ origin: "https://evil.example" }))).toThrow();
    expect(() => assertSameOrigin(req({ "sec-fetch-site": "cross-site" }))).toThrow();
  });
  it("ignores safe methods", () => {
    expect(() => assertSameOrigin(req({ origin: "https://evil.example" }, "GET"))).not.toThrow();
  });
});

describe("safeNext", () => {
  it("only allows same-site paths", () => {
    expect(safeNext("/owner/menu")).toBe("/owner/menu");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil", "javascript:alert(1)", undefined]) {
      expect(safeNext(bad)).toBe("/account");
    }
  });
});

describe("validation", () => {
  it("normalises email", () => {
    expect(emailSchema.parse("  Jane@Example.COM ")).toBe("jane@example.com");
    expect(emailSchema.safeParse("nope").success).toBe(false);
  });
  it("enforces the password policy", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("allletters").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(70) + "12345").success).toBe(false);
    expect(passwordSchema.safeParse("GoodPass1").success).toBe(true);
  });
  it("never accepts a role from the client", () => {
    const parsed = registerSchema.parse({ name: "Jo Doe", email: "jo@example.com", password: "GoodPass1", role: "ADMIN" });
    expect(parsed.role).toBeUndefined();
  });
  it("checks password confirmation in the form schema", () => {
    const base = { name: "Jo Doe", email: "jo@example.com", password: "GoodPass1" };
    expect(registerFormSchema.safeParse({ ...base, confirmPassword: "GoodPass2" }).success).toBe(false);
    expect(registerFormSchema.safeParse({ ...base, confirmPassword: "GoodPass1" }).success).toBe(true);
  });
  it("login accepts any non-empty password so policy changes don't lock people out", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});
