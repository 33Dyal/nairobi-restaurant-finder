export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let refreshing = null;

// One refresh at a time, so several failing requests don't each rotate the token.
function refreshSession() {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((r) => r.ok)
    .finally(() => { refreshing = null; });
  return refreshing;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { res, json };
}

export async function apiFetch(path, options = {}) {
  let { res, json } = await request(path, options);

  // An expired access token is refreshed once, then the request is retried.
  if (res.status === 401 && !path.startsWith("/api/auth/") && (await refreshSession())) {
    ({ res, json } = await request(path, options));
  }
  if (!res.ok) {
    throw new ApiClientError(json?.error?.message ?? "Something went wrong. Please try again.", res.status, json?.error?.details);
  }
  return json?.data;
}
