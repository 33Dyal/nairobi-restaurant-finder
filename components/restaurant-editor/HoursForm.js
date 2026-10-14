"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { todayInNairobi } from "@/lib/validation/restaurant-hours";
import Button from "@/components/ui/Button";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // the week starts on Monday; 0 = Sunday, as in lib/hours.js
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CONTROL = "min-h-11 rounded-lg border border-field bg-surface px-3 text-base sm:text-sm";
const SMALL_BTN = "rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:bg-surface";

let counter = 0;
const nextKey = () => `special-${++counter}`;

const firstSlot = () => ({ opens: "09:00", closes: "22:00" });
const extraSlot = () => ({ opens: "17:00", closes: "22:00" });

export default function HoursForm({ restaurantId, initial }) {
  const router = useRouter();

  // days[0..6] holds the periods for each day of the week (0 = Sunday).
  const [days, setDays] = useState(() => {
    const byDay = Array.from({ length: 7 }, () => []);
    for (const p of initial.periods) byDay[p.day].push({ opens: p.opens, closes: p.closes });
    return byDay;
  });
  const [special, setSpecial] = useState(() => initial.special.map((s) => ({ ...s, key: nextKey() })));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const touch = () => setSaved(false);

  const setSlot = (dow, i, field, value) => {
    touch();
    setDays((d) => d.map((slots, idx) => (idx === dow ? slots.map((s, j) => (j === i ? { ...s, [field]: value } : s)) : slots)));
  };
  const addSlot = (dow) => {
    touch();
    setDays((d) => d.map((slots, idx) => (idx === dow ? [...slots, slots.length ? extraSlot() : firstSlot()] : slots)));
  };
  const removeSlot = (dow, i) => {
    touch();
    setDays((d) => d.map((slots, idx) => (idx === dow ? slots.filter((_, j) => j !== i) : slots)));
  };
  const copyMonday = () => {
    touch();
    setDays((d) => d.map((slots, idx) => (idx === 1 ? slots : d[1].map((s) => ({ ...s })))));
  };

  const addSpecial = () => {
    touch();
    setSpecial((s) => [
      ...s,
      { key: nextKey(), date: todayInNairobi(), type: "SPECIAL", label: "", closed: true, opens: "09:00", closes: "22:00" },
    ]);
  };
  const updateSpecial = (key, patch) => {
    touch();
    setSpecial((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };
  const removeSpecial = (key) => {
    touch();
    setSpecial((list) => list.filter((s) => s.key !== key));
  };

  function buildPayload() {
    const periods = [];
    for (const dow of ORDER) {
      for (const slot of days[dow]) {
        if (!slot.opens || !slot.closes) throw new Error(`Fill in both times for ${NAMES[dow]}, or remove the row.`);
        periods.push({ day: dow, opens: slot.opens, closes: slot.closes });
      }
    }
    const specialDays = special.map((s) => {
      if (!s.date) throw new Error("Choose a date for every special day.");
      return {
        date: s.date,
        type: s.type,
        label: s.label,
        closed: s.closed,
        opens: s.closed ? null : s.opens,
        closes: s.closed ? null : s.closes,
      };
    });
    return { periods, special: specialDays };
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    let body;
    try {
      body = buildPayload();
    } catch (err) {
      setError(err.message);
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/manage/restaurants/${restaurantId}/hours`, { method: "PUT", body });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const minDate = todayInNairobi();

  return (
    <form onSubmit={save} className="space-y-8">
      {error && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-400">{error}</p>}
      {saved && <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">Saved.</p>}

      <fieldset>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Weekly hours</legend>
          <button type="button" className={SMALL_BTN} onClick={copyMonday}>Copy Monday&apos;s hours to every day</button>
        </div>
        <p className="mb-2 text-xs text-ink-soft">
          A day with no hours shows as closed. For late nights, end after midnight (18:00 to 02:00). Use 00:00 to 00:00 for 24 hours.
        </p>

        <div className="divide-y divide-line">
          {ORDER.map((dow) => (
            <div key={dow} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-6">
              <p className="w-28 shrink-0 text-sm font-medium">{NAMES[dow]}</p>
              <div className="flex-1 space-y-2">
                {days[dow].length === 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink-soft">Closed</span>
                    <button type="button" className={SMALL_BTN} onClick={() => addSlot(dow)}>Add hours</button>
                  </div>
                ) : (
                  <>
                    {days[dow].map((slot, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          aria-label={`${NAMES[dow]} opens`}
                          value={slot.opens}
                          onChange={(e) => setSlot(dow, i, "opens", e.target.value)}
                          className={CONTROL}
                        />
                        <span className="text-sm text-ink-soft">to</span>
                        <input
                          type="time"
                          aria-label={`${NAMES[dow]} closes`}
                          value={slot.closes}
                          onChange={(e) => setSlot(dow, i, "closes", e.target.value)}
                          className={CONTROL}
                        />
                        <button type="button" className={SMALL_BTN} onClick={() => removeSlot(dow, i)}>Remove</button>
                      </div>
                    ))}
                    <button type="button" className="text-xs text-lantern hover:underline" onClick={() => addSlot(dow)}>
                      Add another period
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Special days</legend>
          <button type="button" className={SMALL_BTN} onClick={addSpecial}>Add a special day</button>
        </div>
        <p className="text-xs text-ink-soft">
          Holidays or one-off changes. A special day replaces that date&apos;s weekly hours. Past dates are removed automatically.
        </p>

        {special.length === 0 && <p className="text-sm text-ink-soft">No special days.</p>}

        {special.map((s) => (
          <div key={s.key} className="space-y-3 rounded-lg border border-line p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="date"
                aria-label="Date"
                min={minDate}
                value={s.date}
                onChange={(e) => updateSpecial(s.key, { date: e.target.value })}
                className={CONTROL}
              />
              <input
                aria-label="Label"
                placeholder="Label, e.g. Christmas Day"
                maxLength={60}
                value={s.label}
                onChange={(e) => updateSpecial(s.key, { label: e.target.value })}
                className={CONTROL}
              />
              <select
                aria-label="Type"
                value={s.type}
                onChange={(e) => updateSpecial(s.key, { type: e.target.value })}
                className={CONTROL}
              >
                <option value="SPECIAL">Special day</option>
                <option value="HOLIDAY">Public holiday</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.closed}
                  onChange={(e) => updateSpecial(s.key, { closed: e.target.checked })}
                  className="h-4 w-4"
                />
                Closed all day
              </label>
              {!s.closed && (
                <>
                  <input
                    type="time"
                    aria-label="Opens"
                    value={s.opens}
                    onChange={(e) => updateSpecial(s.key, { opens: e.target.value })}
                    className={CONTROL}
                  />
                  <span className="text-sm text-ink-soft">to</span>
                  <input
                    type="time"
                    aria-label="Closes"
                    value={s.closes}
                    onChange={(e) => updateSpecial(s.key, { closes: e.target.value })}
                    className={CONTROL}
                  />
                </>
              )}
              <button type="button" className={`${SMALL_BTN} ml-auto`} onClick={() => removeSpecial(s.key)}>Remove</button>
            </div>
          </div>
        ))}
      </fieldset>

      <Button type="submit" loading={saving} className="w-full sm:w-auto">Save opening hours</Button>
    </form>
  );
}
