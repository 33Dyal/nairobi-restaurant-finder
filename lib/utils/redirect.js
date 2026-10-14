// Only allow same-site relative paths, to prevent open redirects via ?next=
export function safeNext(value, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export function postLoginPath(user, next) {
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (user.role === "ADMIN") return safeNext ?? "/admin";
  if (user.role === "OWNER") return safeNext ?? "/owner";
  return safeNext ?? "/";
}