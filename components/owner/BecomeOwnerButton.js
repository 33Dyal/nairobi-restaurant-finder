"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import Button from "@/components/ui/Button";

const NEXT = "/owner/restaurants/new";

export default function BecomeOwnerButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/owner/join", { method: "POST" });
      // If fresh cookies couldn't be issued, a quick sign-in applies the new role.
      router.push(data?.relogin ? `/login?next=${encodeURIComponent(NEXT)}` : NEXT);
      router.refresh();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={start} loading={loading}>Start listing my restaurant</Button>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}