"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Clock } from "lucide-react";
import { PRICE_LABELS, PRICE_KES, RATING_OPTIONS } from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";

// URL contract for /explore (Phase 5 reads these):
// q, cuisine, area, vibe, price, rating (minimum), open=1
function QuickSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="sr-only" htmlFor={`qf-${label}`}>{label}</label>
      <select
        id={`qf-${label}`} value={value} onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-field bg-surface px-3 text-sm text-ink"
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// FIX: default the list props to [] so the component never crashes if one is missing
export default function HeroSearch({ cuisines = [], areas = [], vibes = [] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [f, setF] = useState({ q: "", cuisine: "", area: "", vibe: "", price: "", rating: "", open: false });
  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (f.q.trim()) params.set("q", f.q.trim());
    for (const key of ["cuisine", "area", "vibe", "price", "rating"]) if (f[key]) params.set(key, f[key]);
    if (f.open) params.set("open", "1");
    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  const toOptions = (rows) => (rows ?? []).map((r) => ({ value: r.slug, label: r.name }));

  return (
    <motion.form
      role="search" aria-label="Find a restaurant" onSubmit={onSubmit}
      initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl bg-surface p-3 shadow-xl sm:p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="hero-q" className="sr-only">Search restaurants, cuisines, dishes or areas</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            id="hero-q" type="search" value={f.q} onChange={(e) => set("q")(e.target.value)} autoComplete="off"
            placeholder={"Try \u201CItalian in Kilimani\u201D or \u201Cnyama choma\u201D"}
            className="min-h-12 w-full rounded-lg border border-field bg-surface pl-11 pr-3 text-base placeholder:text-ink-faint sm:text-sm"
          />
        </div>
        <button type="submit" className="min-h-12 rounded-lg bg-jacaranda-600 px-6 text-sm font-semibold text-black hover:bg-jacaranda-700">Search</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <QuickSelect label="Cuisine" value={f.cuisine} onChange={set("cuisine")} options={toOptions(cuisines)} />
        <QuickSelect label="Area" value={f.area} onChange={set("area")} options={toOptions(areas)} />
        <QuickSelect label="Vibe" value={f.vibe} onChange={set("vibe")} options={toOptions(vibes)} />
        <QuickSelect label="Budget" value={f.price} onChange={set("price")} options={Object.entries(PRICE_LABELS).map(([value, label]) => ({ value, label: `${label} (${PRICE_KES[value]})` }))} />
        <QuickSelect label="Rating" value={f.rating} onChange={set("rating")} options={RATING_OPTIONS} />
        <button
          type="button" aria-pressed={f.open} onClick={() => set("open")(!f.open)}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
            f.open ? "border-jacaranda-600 bg-jacaranda-600 text-black" : "border-line bg-surface text-ink hover:bg-paper"
          )}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />Open now
        </button>
      </div>
    </motion.form>
  );
}
