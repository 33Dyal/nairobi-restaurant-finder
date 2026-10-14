"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { safeNext } from "@/lib/utils/redirect";

// The proxy sends people here when their short-lived access token has expired
// but their session is still valid. It refreshes, then continues to the page.
export default function SessionRefresh() {
  const next = safeNext(useSearchParams().get("next"));

  useEffect(() => {
    fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
      .then((r) => window.location.replace(r.ok ? next : `/login?next=${encodeURIComponent(next)}`))
      .catch(() => window.location.replace(`/login?next=${encodeURIComponent(next)}`));
  }, [next]);

  return <p role="status" className="flex items-center justify-center gap-2 py-24 text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Restoring your session…</p>;
}
