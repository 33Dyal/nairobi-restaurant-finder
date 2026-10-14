export const ACCESS_COOKIE = "ne_access";
export const REFRESH_COOKIE = "ne_refresh";
// Non-sensitive flag so the proxy knows a refresh is worth attempting.
export const SESSION_COOKIE = "ne_session";

export const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const VERIFY_EMAIL_TTL_SECONDS = 24 * 60 * 60; // 24 hours
export const RESET_PASSWORD_TTL_SECONDS = 60 * 60; // 1 hour
export const REFRESH_GRACE_MS = 10_000;

export const ROLES = { CUSTOMER: "CUSTOMER", OWNER: "OWNER", ADMIN: "ADMIN" };
