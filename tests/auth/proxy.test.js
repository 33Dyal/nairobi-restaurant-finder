import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { signAccessToken } from "@/lib/auth/jwt";

const req = (path, cookie) => new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });
const access = async (role) => `ne_access=${await signAccessToken({ sub: "u1", role })}`;
const location = (res) => res.headers.get("location") && new URL(res.headers.get("location")).pathname + new URL(res.headers.get("location")).search;
const passes = (res) => res.headers.get("x-middleware-next") === "1";

describe("proxy route protection", () => {
  it("sends anonymous visitors to login and keeps the destination", async () => {
    expect(location(await proxy(req("/account")))).toBe("/login?next=%2Faccount");
    expect(location(await proxy(req("/favorites?tab=saved")))).toBe("/login?next=%2Ffavorites%3Ftab%3Dsaved");
    expect(location(await proxy(req("/owner/menu")))).toBe("/login?next=%2Fowner%2Fmenu");
  });

  it("tries a refresh first when the session cookie exists but the access token is gone", async () => {
    expect(location(await proxy(req("/account", "ne_session=1")))).toBe("/refresh-session?next=%2Faccount");
  });

  it("treats a tampered or wrong-type token as signed out", async () => {
    expect(location(await proxy(req("/admin", "ne_access=abc.def.ghi")))).toBe("/login?next=%2Fadmin");
  });

  it("lets signed-in customers into account and favorites only", async () => {
    const c = await access("CUSTOMER");
    expect(passes(await proxy(req("/account", c)))).toBe(true);
    expect(passes(await proxy(req("/favorites", c)))).toBe(true);
    expect(location(await proxy(req("/owner", c)))).toBe("/forbidden");
    expect(location(await proxy(req("/admin/users", c)))).toBe("/forbidden");
  });

  it("applies role rules for owners and admins", async () => {
    const o = await access("OWNER");
    const a = await access("ADMIN");
    expect(passes(await proxy(req("/owner/menu", o)))).toBe(true);
    expect(location(await proxy(req("/admin", o)))).toBe("/forbidden");
    expect(passes(await proxy(req("/admin", a)))).toBe(true);
    expect(passes(await proxy(req("/owner", a)))).toBe(true);
  });

  it("does not match look-alike paths", async () => {
    // "/accounting" is not "/account"
    expect(passes(await proxy(req("/accounting")))).toBe(true);
  });

  it("bounces signed-in users away from login and register", async () => {
    const c = await access("CUSTOMER");
    expect(location(await proxy(req("/login", c)))).toBe("/account");
    expect(location(await proxy(req("/register", c)))).toBe("/account");
    expect(passes(await proxy(req("/login")))).toBe(true);
  });
});
