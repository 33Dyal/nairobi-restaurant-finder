import { cookies } from "next/headers";
import {
  ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE,
  ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS,
} from "./constants";

const base = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

export async function setAuthCookies({ accessToken, refreshToken }) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, { ...base(), path: "/", maxAge: ACCESS_TTL_SECONDS });
  // The refresh token is only ever sent to /api/auth/*.
  store.set(REFRESH_COOKIE, refreshToken, { ...base(), path: "/api/auth", maxAge: REFRESH_TTL_SECONDS });
  store.set(SESSION_COOKIE, "1", { ...base(), path: "/", maxAge: REFRESH_TTL_SECONDS });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { ...base(), path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { ...base(), path: "/api/auth", maxAge: 0 });
  store.set(SESSION_COOKIE, "", { ...base(), path: "/", maxAge: 0 });
}

export async function getAccessCookie() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshCookie() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}
