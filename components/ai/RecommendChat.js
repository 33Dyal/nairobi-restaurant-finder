"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import RestaurantCard from "@/components/restaurant/RestaurantCard";

const EXAMPLES = [
  "Affordable Italian in Westlands",
  "Romantic rooftop dinner for two",
  "Best vegan restaurants",
  "Cheap nyama choma, open now",
];

// `compact` is for narrow containers like the floating chat panel:
// the form stacks and results show in a single column.
export default function RecommendChat({ compact = false }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle" });

  async function ask(text) {
    const q = text.trim();
    if (q.length < 3 || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const data = await apiFetch("/api/recommendation", { method: "POST", body: { query: q } });
      setState({ status: "done", data });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  const data = state.data;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => { e.preventDefault(); ask(query); }}
        className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row"}
      >
        <label htmlFor="ask-input" className="sr-only">What are you looking for?</label>
        <input
          id="ask-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={300}
          placeholder="e.g. a cheap Italian place in Westlands, open now"
          className="min-h-12 w-full rounded-lg border border-field bg-surface px-4 text-base placeholder:text-ink-faint sm:text-sm"
        />
        <button
          type="submit"
          disabled={state.status === "loading" || query.trim().length < 3}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          Find restaurants
        </button>
      </form>

      <ul className="flex flex-wrap gap-2" aria-label="Example requests">
        {EXAMPLES.map((ex) => (
          <li key={ex}>
            <button type="button" onClick={() => { setQuery(ex); ask(ex); }} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-surface">
              {ex}
            </button>
          </li>
        ))}
      </ul>

      {/* One short announcement for screen readers, instead of re-reading every result card. */}
      <p className="sr-only" role="status" aria-live="polite">
        {state.status === "loading" ? "Searching for restaurants\u2026" : state.status === "done" ? data.message : ""}
      </p>

      <div>
        {state.status === "error" && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-400">{state.message}</p>}

        {data && (
          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p>{data.message}</p>
              {data.understood.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-xs" aria-label="What we understood">
                  {data.understood.map((u) => <li key={u} className="rounded-full bg-black/40 px-2.5 py-1 text-ink-soft">{u}</li>)}
                </ul>
              )}
              {data.restaurants.length === 0 && data.understood.length > 0 && (
                <Link href="/explore" className="mt-3 inline-block text-sm font-medium text-lantern hover:underline">Browse all restaurants</Link>
              )}
            </div>

            {data.restaurants.length > 0 && (
              <ul className={compact ? "grid grid-cols-1 gap-4" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
                {data.restaurants.map((r) => (
                  <li key={r.id}><RestaurantCard restaurant={r} headingLevel={compact ? 3 : 2} /></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
