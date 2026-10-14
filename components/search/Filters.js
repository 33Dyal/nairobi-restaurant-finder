"use client";
import { PRICE_LABELS, PRICE_KES } from "@/lib/constants/labels";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const SORTS = [["trending", "Trending"], ["rating", "Top rated"], ["newest", "Newest"], ["name", "A to Z"]];
const RATINGS = [["0", "Any rating"], ["3", "3+ stars"], ["4", "4+ stars"], ["4.5", "4.5+ stars"]];

// The selected chip is white (jacaranda-600), so its text must be black. It was text-white,
// which made the label of every selected filter invisible.
const chip = (on) => cn("rounded-full border px-3 py-1.5 text-sm transition-colors",
  on ? "border-jacaranda-600 bg-jacaranda-600 font-semibold text-black" : "border-line bg-surface hover:bg-paper");

export default function Filters({ facets }) {
  const router = useRouter();
  const params = useSearchParams();
  const list = (key) => (params.get(key) ?? "").split(",").filter(Boolean);

  function set(key, value) {
    const sp = new URLSearchParams(params.toString());
    value ? sp.set(key, value) : sp.delete(key);
    sp.delete("page");
    router.replace(`/explore?${sp}`, { scroll: false });
  }
  function toggle(key, v) {
    const cur = list(key);
    set(key, (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(","));
  }
  function clearAll() {
    const q = params.get("q");
    router.replace(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore", { scroll: false });
  }

  const group = (title, name, items) => items.length > 0 && (
    <fieldset key={name}>
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map(({ value, label }) => (
          <button key={value} type="button" aria-pressed={list(name).includes(value)} onClick={() => toggle(name, value)} className={chip(list(name).includes(value))}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
  const fromFacet = (rows) => rows.filter((r) => r.count > 0).map((r) => ({ value: r.slug, label: `${r.name} (${r.count})` }));

  const featured = params.get("featured") === "1";
  const active = ["cuisine", "area", "vibe", "price"].reduce((n, k) => n + list(k).length, 0) + (Number(params.get("rating")) > 0 ? 1 : 0) + (featured ? 1 : 0);
  const field = "min-h-10 rounded-lg border border-field bg-surface px-3 text-sm";

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      {group("Cuisine", "cuisine", fromFacet(facets.cuisines))}
      {group("Area", "area", fromFacet(facets.areas))}
      {group("Vibe", "vibe", fromFacet(facets.vibes))}
      {group("Price", "price", facets.prices.map((p) => ({ value: p, label: PRICE_LABELS[p] ? `${PRICE_LABELS[p]} (${PRICE_KES[p]})` : p })))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-pressed={featured} onClick={() => set("featured", featured ? "" : "1")} className={chip(featured)}>Featured only</button>
        <label className="flex items-center gap-2 text-sm font-semibold">Rating
          <select className={field} value={params.get("rating") ?? "0"} onChange={(e) => set("rating", e.target.value === "0" ? "" : e.target.value)}>
            {RATINGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">Sort by
          <select className={field} value={params.get("sort") ?? "trending"} onChange={(e) => set("sort", e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {active > 0 && <button type="button" onClick={clearAll} className="text-sm font-semibold text-jacaranda-700 hover:underline">Clear filters ({active})</button>}
      </div>
    </div>
  );
}
