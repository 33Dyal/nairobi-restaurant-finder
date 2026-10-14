"use client";

import { useEffect, useState } from "react";

const COOLDOWN_SECONDS = 60;

export default function ResendVerification({ email }) {
  const [seconds, setSeconds] = useState(COOLDOWN_SECONDS);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  async function resend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
    setSeconds(COOLDOWN_SECONDS);
  }

  const disabled = seconds > 0 || status === "sending";

  return (
    <div className="mt-4 space-y-2 text-sm text-ink-soft">
      <p>
        Didn&apos;t get it? Check your spam or promotions folder, or{" "}
        <button
          type="button"
          onClick={resend}
          disabled={disabled}
          className="font-semibold text-lantern underline disabled:no-underline disabled:opacity-50"
        >
          {status === "sending" ? "sending…" : seconds > 0 ? `resend in ${seconds}s` : "resend the email"}
        </button>
        .
      </p>
      {status === "sent" && <p role="status">If that address can receive it, a new email is on its way.</p>}
      {status === "error" && <p role="alert">Couldn&apos;t resend right now. Please try again in a moment.</p>}
    </div>
  );
}