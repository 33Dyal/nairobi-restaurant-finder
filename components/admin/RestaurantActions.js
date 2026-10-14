"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

const BASE = "rounded-md border px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50";
const NEUTRAL = `${BASE} border-line hover:bg-surface`;
const GOOD = `${BASE} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`;
const BAD = `${BASE} border-red-500/50 text-red-300 hover:bg-red-500/10`;

export default function RestaurantActions({ id, approvalStatus, verificationStatus, isFeatured }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(patch) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/restaurants/${id}`, { method: "PATCH", body: patch });
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {approvalStatus !== "APPROVED" && (
          <button type="button" disabled={busy} className={GOOD} onClick={() => update({ approvalStatus: "APPROVED" })}>
            Approve
          </button>
        )}
        {approvalStatus !== "REJECTED" && (
          <button
            type="button"
            disabled={busy}
            className={BAD}
            onClick={() => {
              if (window.confirm("Reject this restaurant? It will be hidden from the public site.")) {
                update({ approvalStatus: "REJECTED" });
              }
            }}
          >
            Reject
          </button>
        )}
        {verificationStatus !== "VERIFIED" ? (
          <button type="button" disabled={busy} className={NEUTRAL} onClick={() => update({ verificationStatus: "VERIFIED" })}>
            Verify
          </button>
        ) : (
          <button type="button" disabled={busy} className={NEUTRAL} onClick={() => update({ verificationStatus: "PENDING" })}>
            Unverify
          </button>
        )}
        <button
          type="button"
          disabled={busy || (!isFeatured && approvalStatus !== "APPROVED")}
          title={!isFeatured && approvalStatus !== "APPROVED" ? "Approve the restaurant before featuring it" : undefined}
          className={NEUTRAL}
          onClick={() => update({ isFeatured: !isFeatured })}
        >
          {isFeatured ? "Unfeature" : "Feature"}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
