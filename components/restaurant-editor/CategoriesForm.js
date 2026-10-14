"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import Button from "@/components/ui/Button";

const AMENITY_GROUPS = [
  ["FACILITY", "Facilities"],
  ["DIETARY", "Dietary options"],
  ["ENTERTAINMENT", "Entertainment"],
];

const CONTROL = "min-h-12 w-full rounded-lg border border-field bg-surface px-4 text-base sm:text-sm";

function CheckGrid({ legend, hint, items, selected, onToggle }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold uppercase tracking-wide text-ink-faint">{legend}</legend>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                checked ? "border-white bg-white/10" : "border-line hover:bg-surface"
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)} className="h-4 w-4" />
              {item.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function CategoriesForm({ restaurantId, options, selected }) {
  const router = useRouter();
  const [cuisineIds, setCuisineIds] = useState(selected.cuisineIds);
  const [primary, setPrimary] = useState(selected.primaryCuisineId);
  const [vibeIds, setVibeIds] = useState(selected.vibeIds);
  const [amenityIds, setAmenityIds] = useState(selected.amenityIds);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const flip = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  function toggleCuisine(id) {
    setSaved(false);
    const next = flip(cuisineIds, id);
    setCuisineIds(next);
    // Keep the main cuisine valid: the first one chosen, or the first left after a removal.
    if (!next.includes(primary)) setPrimary(next[0] ?? "");
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (cuisineIds.length === 0) {
      setError("Choose at least one cuisine.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/manage/restaurants/${restaurantId}/categories`, {
        method: "PUT",
        body: { cuisineIds, primaryCuisineId: primary, vibeIds, amenityIds },
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const chosenCuisines = options.cuisines.filter((c) => cuisineIds.includes(c.id));

  return (
    <form onSubmit={save} className="space-y-8">
      {error && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-400">{error}</p>}
      {saved && <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">Saved.</p>}

      <div className="space-y-4">
        <CheckGrid
          legend="Cuisines"
          hint="Choose up to 6."
          items={options.cuisines}
          selected={cuisineIds}
          onToggle={toggleCuisine}
        />
        {chosenCuisines.length > 1 && (
          <div className="max-w-xs space-y-1.5">
            <label htmlFor="c-primary" className="block text-sm font-medium">Main cuisine</label>
            <select
              id="c-primary"
              value={primary}
              onChange={(e) => {
                setPrimary(e.target.value);
                setSaved(false);
              }}
              className={CONTROL}
            >
              {chosenCuisines.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <CheckGrid
        legend="Vibes"
        hint="Choose up to 8."
        items={options.vibes}
        selected={vibeIds}
        onToggle={(id) => {
          setSaved(false);
          setVibeIds((cur) => flip(cur, id));
        }}
      />

      {AMENITY_GROUPS.map(([category, label]) => {
        const items = options.amenities.filter((a) => a.category === category);
        if (items.length === 0) return null;
        return (
          <CheckGrid
            key={category}
            legend={label}
            items={items}
            selected={amenityIds}
            onToggle={(id) => {
              setSaved(false);
              setAmenityIds((cur) => flip(cur, id));
            }}
          />
        );
      })}

      <Button type="submit" loading={saving} className="w-full sm:w-auto">Save categories</Button>
    </form>
  );
}
