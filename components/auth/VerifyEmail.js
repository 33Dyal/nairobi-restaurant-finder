"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { ME_KEY } from "@/hooks/useAuth";
import { FormError } from "./AuthCard";

export default function VerifyEmail() {
  const token = useSearchParams().get("token");
  const qc = useQueryClient();
  const started = useRef(false);
  const [state, setState] = useState(
    token ? { status: "loading" } : { status: "error", message: "This verification link is incomplete." }
  );

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // the token is single use, so don't run twice in development
    apiFetch("/api/auth/verify-email", { method: "POST", body: { token } })
      .then(() => {
        setState({ status: "done" });
        qc.invalidateQueries({ queryKey: ME_KEY });
      })
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [token, qc]);

  if (state.status === "loading") {
    return (
      <p role="status" className="flex items-center gap-2 text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Verifying your email…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-3">
        <FormError>{state.message}</FormError>
        <p className="text-sm text-ink-soft">
          If you already verified your email, you can sign in now. Otherwise, sign in and use
          &ldquo;Resend verification email&rdquo; on your account page to get a new link.
        </p>
        <Link href="/login" className="text-sm font-medium text-lantern hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5" role="status">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-lantern" aria-hidden="true" />
        <div>
          <h2 className="font-display text-xl font-bold">Email verified. Welcome to Nairobi Eats!</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Your account is ready. Sign in to save favorites, write reviews and catch offers near you.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-jacaranda-600 text-sm font-semibold text-black hover:bg-jacaranda-700"
        >
          Continue to sign in
        </Link>
        <Link
          href="/explore"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line text-sm font-semibold hover:bg-surface"
        >
          Browse restaurants
        </Link>
      </div>
    </div>
  );
}