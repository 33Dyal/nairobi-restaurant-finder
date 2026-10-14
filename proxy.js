import { NextResponse } from "next/server";
import { ACCESS_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants";
import { verifyAccessToken } from "@/lib/auth/jwt";

// First line of defence for page routes. Server pages and API routes check the
// user again, because the proxy only reads the signed token.
const RULES = [
  { prefix: "/account" },
  { prefix: "/favorites" },
  { prefix: "/owner", roles: ["OWNER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

const matches = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  // Signed-in users don't need the login or register pages.
  if (pathname === "/login" || pathname === "/register") {
    return payload ? NextResponse.redirect(new URL("/account", request.url)) : NextResponse.next();
  }

  const rule = RULES.find((r) => matches(pathname, r.prefix));
  if (!rule) return NextResponse.next();

  if (!payload) {
    const next = encodeURIComponent(pathname + search);
    const hasSession = request.cookies.get(SESSION_COOKIE)?.value;
    // An expired access token with a live session gets refreshed first.
    const target = hasSession ? `/refresh-session?next=${next}` : `/login?next=${next}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (rule.roles && !rule.roles.includes(payload.role)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/favorites/:path*", "/owner/:path*", "/admin/:path*", "/login", "/register"],
};
