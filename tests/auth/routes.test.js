import { describe, it, expect, beforeEach, vi } from "vitest";
import fake from "../helpers/fake-prisma";

vi.mock("@/lib/db/prisma", () => ({ prisma: fake }));

const jar = new Map();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined),
    set: (n, v, o) => (o?.maxAge === 0 ? jar.delete(n) : jar.set(n, v)),
  }),
}));

const sent = [];
vi.mock("@/lib/resend/mailer", () => ({ sendEmail: async (m) => void sent.push(m) }));
vi.mock("next/server", async (orig) => ({ ...(await orig()), after: (fn) => fn() }));

const { resetRateLimits } = await import("@/lib/auth/rate-limit");
const routes = {
  register: (await import("@/app/api/auth/register/route.js")).POST,
  login: (await import("@/app/api/auth/login/route.js")).POST,
  refresh: (await import("@/app/api/auth/refresh/route.js")).POST,
  logout: (await import("@/app/api/auth/logout/route.js")).POST,
  me: (await import("@/app/api/auth/me/route.js")).GET,
  verify: (await import("@/app/api/auth/verify-email/route.js")).POST,
  forgot: (await import("@/app/api/auth/forgot-password/route.js")).POST,
  reset: (await import("@/app/api/auth/reset-password/route.js")).POST,
  resend: (await import("@/app/api/auth/resend-verification/route.js")).POST,
};

let ipCounter = 0;
async function call(name, body, { headers = {}, method = "POST" } = {}) {
  const req = new Request(`http://localhost:3000/api/auth/${name}`, {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": `10.0.0.${ipCounter}`, ...headers },
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });
  const res = await routes[name](req);
  return { status: res.status, json: await res.json() };
}
const tokenFromEmail = (m) => new URL(m.text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");
const newUser = { name: "Jane Doe", email: "jane@example.com", password: "GoodPass1" };

beforeEach(() => {
  fake.reset();
  jar.clear();
  sent.length = 0;
  resetRateLimits();
  ipCounter++;
});

async function registerAndVerify() {
  await call("register", newUser);
  await call("verify", { token: tokenFromEmail(sent.at(-1)) });
}

describe("register + verify", () => {
  it("creates a CUSTOMER with a hashed password and sends a verification email", async () => {
    const res = await call("register", { ...newUser, role: "ADMIN" });
    expect(res.status).toBe(201);
    const user = fake.user.rows[0];
    expect(user.role).toBe("CUSTOMER");
    expect(user.passwordHash).not.toBe(newUser.password);
    expect(user.emailVerifiedAt).toBeNull();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("jane@example.com");
  });

  it("returns the same response for an already-registered email and does not create a duplicate", async () => {
    const first = await call("register", newUser);
    const second = await call("register", newUser);
    expect(second.status).toBe(first.status);
    expect(second.json).toEqual(first.json);
    expect(fake.user.rows).toHaveLength(1);
    expect(sent.at(-1).subject).toMatch(/already have/i);
  });

  it("verifies the email once, and rejects a reused or bad token", async () => {
    await call("register", newUser);
    const token = tokenFromEmail(sent[0]);
    expect((await call("verify", { token })).status).toBe(200);
    expect(fake.user.rows[0].emailVerifiedAt).toBeTruthy();
    expect((await call("verify", { token })).status).toBe(400);
    expect((await call("verify", { token: "x".repeat(40) })).status).toBe(400);
  });

  it("validates input", async () => {
    const res = await call("register", { name: "J", email: "bad", password: "short" });
    expect(res.status).toBe(422);
    expect(res.json.error.details.email).toBeTruthy();
    expect(res.json.error.details.password).toBeTruthy();
  });

  it("rate limits registration", async () => {
    for (let i = 0; i < 5; i++) await call("register", { ...newUser, email: `u${i}@example.com` });
    expect((await call("register", { ...newUser, email: "u9@example.com" })).status).toBe(429);
  });
});

describe("login, session, logout", () => {
  it("logs in, sets httpOnly-style cookies and returns the user (no hash)", async () => {
    await registerAndVerify();
    const res = await call("login", { email: "JANE@example.com", password: newUser.password });
    expect(res.status).toBe(200);
    expect(res.json.data.user).toMatchObject({ email: "jane@example.com", role: "CUSTOMER", emailVerified: true });
    expect(JSON.stringify(res.json)).not.toContain("passwordHash");
    expect(jar.has("ne_access") && jar.has("ne_refresh") && jar.has("ne_session")).toBe(true);
    expect((await call("me", null, { method: "GET" })).json.data.user.email).toBe("jane@example.com");
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await registerAndVerify();
    const wrong = await call("login", { email: newUser.email, password: "WrongPass1" });
    const unknown = await call("login", { email: "nobody@example.com", password: "WrongPass1" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.json).toEqual(unknown.json);
    expect(jar.size).toBe(0);
  });

  it("blocks suspended accounts only after a correct password", async () => {
    await registerAndVerify();
    fake.user.rows[0].status = "SUSPENDED";
    expect((await call("login", { email: newUser.email, password: "WrongPass1" })).status).toBe(401);
    expect((await call("login", { email: newUser.email, password: newUser.password })).status).toBe(403);
  });

  it("locks out repeated failures", async () => {
    await registerAndVerify();
    for (let i = 0; i < 8; i++) await call("login", { email: newUser.email, password: "WrongPass1" });
    expect((await call("login", { email: newUser.email, password: newUser.password })).status).toBe(429);
  });

  it("refreshes the session and rotates the cookie", async () => {
    await registerAndVerify();
    await call("login", newUser);
    const before = jar.get("ne_refresh");
    const res = await call("refresh");
    expect(res.status).toBe(200);
    expect(jar.get("ne_refresh")).not.toBe(before);
  });

  it("rejects a replayed refresh token and clears cookies", async () => {
    await registerAndVerify();
    await call("login", newUser);
    const stolen = jar.get("ne_refresh");
    await call("refresh");
    fake.refreshToken.rows.forEach((r) => r.revokedAt && (r.revokedAt = new Date(Date.now() - 60_000)));
    jar.set("ne_refresh", stolen);
    const res = await call("refresh");
    expect(res.status).toBe(401);
    expect(jar.has("ne_refresh")).toBe(false);
    expect(fake.refreshToken.rows.every((r) => r.revokedAt)).toBe(true);
  });

  it("logs out: revokes the session and clears cookies", async () => {
    await registerAndVerify();
    await call("login", newUser);
    expect((await call("logout")).status).toBe(200);
    expect(jar.size).toBe(0);
    expect(fake.refreshToken.rows.every((r) => r.revokedAt)).toBe(true);
    expect((await call("me", null, { method: "GET" })).status).toBe(401);
  });

  it("refuses cross-site POSTs", async () => {
    const res = await call("login", newUser, { headers: { origin: "https://evil.example" } });
    expect(res.status).toBe(403);
  });

  it("/me needs a session and hides suspended users immediately", async () => {
    expect((await call("me", null, { method: "GET" })).status).toBe(401);
    await registerAndVerify();
    await call("login", newUser);
    fake.user.rows[0].status = "SUSPENDED";
    expect((await call("me", null, { method: "GET" })).status).toBe(401);
  });
});

describe("password reset", () => {
  it("is silent for unknown emails and emails a link for real ones", async () => {
    const unknown = await call("forgot", { email: "ghost@example.com" });
    expect(unknown.status).toBe(200);
    expect(sent).toHaveLength(0);
    await registerAndVerify();
    sent.length = 0;
    const known = await call("forgot", { email: newUser.email });
    expect(known.json).toEqual(unknown.json);
    expect(sent).toHaveLength(1);
  });

  it("resets the password, signs out all sessions, and the link works once", async () => {
    await registerAndVerify();
    await call("login", newUser);
    await call("forgot", { email: newUser.email });
    const token = tokenFromEmail(sent.at(-1));
    expect((await call("reset", { token, password: "BrandNew22" })).status).toBe(200);
    expect(fake.refreshToken.rows.every((r) => r.revokedAt)).toBe(true);
    expect(fake.auditLog.rows[0].action).toBe("auth.password_reset");
    expect((await call("reset", { token, password: "Another333" })).status).toBe(400);
    expect((await call("login", { email: newUser.email, password: newUser.password })).status).toBe(401);
    expect((await call("login", { email: newUser.email, password: "BrandNew22" })).status).toBe(200);
  });

  it("enforces the password policy on reset", async () => {
    await registerAndVerify();
    await call("forgot", { email: newUser.email });
    const token = tokenFromEmail(sent.at(-1));
    expect((await call("reset", { token, password: "weak" })).status).toBe(422);
  });
});

describe("resend verification", () => {
  it("only sends for unverified accounts, with a uniform response", async () => {
    await call("register", newUser);
    sent.length = 0;
    const a = await call("resend", { email: newUser.email });
    expect(sent).toHaveLength(1);
    await call("verify", { token: tokenFromEmail(sent[0]) });
    sent.length = 0;
    const b = await call("resend", { email: newUser.email });
    const c = await call("resend", { email: "ghost@example.com" });
    expect(sent).toHaveLength(0);
    expect(b.json).toEqual(a.json);
    expect(c.json).toEqual(a.json);
  });
});
