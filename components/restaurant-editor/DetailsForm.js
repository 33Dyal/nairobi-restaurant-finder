"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { restaurantDetailsSchema } from "@/lib/validation/restaurant-editor";
import { apiFetch } from "@/lib/api-client";
import Button from "@/components/ui/Button";

const PRICE_OPTIONS = [
  ["BUDGET", "Budget"],
  ["MODERATE", "Moderate"],
  ["MID_RANGE", "Mid-range"],
  ["PREMIUM", "Premium"],
  ["LUXURY", "Luxury"],
];

const STATUS_OPTIONS = [
  ["OPEN", "Open"],
  ["TEMPORARILY_CLOSED", "Temporarily closed"],
  ["PERMANENTLY_CLOSED", "Permanently closed"],
];

const CONTROL =
  "min-h-12 w-full rounded-lg border border-field bg-surface px-4 text-base placeholder:text-ink-faint sm:text-sm";

function Field({ id, label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-ink-soft">{hint}</p>}
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Group({ title, children }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-faint">{title}</legend>
      {children}
    </fieldset>
  );
}

const text = (v) => v ?? "";

export default function DetailsForm({ restaurant, areas }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(restaurantDetailsSchema),
    defaultValues: {
      name: restaurant.name,
      shortDescription: text(restaurant.shortDescription),
      description: text(restaurant.description),
      areaId: restaurant.areaId,
      address: restaurant.address,
      landmark: text(restaurant.landmark),
      latitude: String(restaurant.latitude),
      longitude: String(restaurant.longitude),
      priceRange: restaurant.priceRange,
      operatingStatus: restaurant.operatingStatus,
      phone: text(restaurant.phone),
      email: text(restaurant.email),
      website: text(restaurant.website),
      instagramUrl: text(restaurant.instagramUrl),
      facebookUrl: text(restaurant.facebookUrl),
      twitterUrl: text(restaurant.twitterUrl),
      tiktokUrl: text(restaurant.tiktokUrl),
      parkingInfo: text(restaurant.parkingInfo),
      accessibilityInfo: text(restaurant.accessibilityInfo),
    },
  });

  const lat = watch("latitude");
  const lng = watch("longitude");
  const hasPin = String(lat).trim() !== "" && String(lng).trim() !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const mapsHref = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;

  // The form is checked in the browser first, then the raw values are sent so the
  // server runs the same checks again and does its own clean-up.
  async function onSubmit() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await apiFetch(`/api/manage/restaurants/${restaurant.id}`, { method: "PATCH", body: getValues() });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onChange={() => saved && setSaved(false)} noValidate className="space-y-8">
      {error && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-400">{error}</p>}
      {saved && <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">Saved.</p>}

      <Group title="Basic information">
        <Field id="d-name" label="Restaurant name" error={errors.name?.message}>
          <input id="d-name" className={CONTROL} {...register("name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="d-priceRange" label="Price range" error={errors.priceRange?.message}>
            <select id="d-priceRange" className={CONTROL} {...register("priceRange")}>
              {PRICE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field id="d-operatingStatus" label="Status" hint="Use Temporarily closed during a break or renovation." error={errors.operatingStatus?.message}>
            <select id="d-operatingStatus" className={CONTROL} {...register("operatingStatus")}>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
        </div>
        <Field id="d-shortDescription" label="One-line summary" hint="Shown on restaurant cards. Up to 160 characters." error={errors.shortDescription?.message}>
          <input id="d-shortDescription" className={CONTROL} maxLength={160} {...register("shortDescription")} />
        </Field>
        <Field id="d-description" label="About the restaurant" error={errors.description?.message}>
          <textarea id="d-description" rows={6} className={`${CONTROL} py-3`} maxLength={2000} {...register("description")} />
        </Field>
      </Group>

      <Group title="Location">
        <Field id="d-areaId" label="Area" error={errors.areaId?.message}>
          <select id="d-areaId" className={CONTROL} {...register("areaId")}>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field id="d-address" label="Street address" error={errors.address?.message}>
          <input id="d-address" className={CONTROL} autoComplete="street-address" {...register("address")} />
        </Field>
        <Field id="d-landmark" label="Landmark" hint="For example, next to a mall or opposite a petrol station." error={errors.landmark?.message}>
          <input id="d-landmark" className={CONTROL} {...register("landmark")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="d-latitude" label="Latitude" error={errors.latitude?.message}>
            <input id="d-latitude" inputMode="decimal" className={CONTROL} {...register("latitude")} />
          </Field>
          <Field id="d-longitude" label="Longitude" error={errors.longitude?.message}>
            <input id="d-longitude" inputMode="decimal" className={CONTROL} {...register("longitude")} />
          </Field>
        </div>
        <p className="text-xs text-ink-soft">
          To find these, right-click your restaurant on Google Maps and click the numbers at the top of the menu. Latitude comes first.{" "}
          {hasPin && (
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-lantern hover:underline">
              Check this location on Google Maps
            </a>
          )}
        </p>
      </Group>

      <Group title="Contact and links">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="d-phone" label="Phone" error={errors.phone?.message}>
            <input id="d-phone" type="tel" className={CONTROL} autoComplete="tel" {...register("phone")} />
          </Field>
          <Field id="d-email" label="Email" error={errors.email?.message}>
            <input id="d-email" type="email" className={CONTROL} {...register("email")} />
          </Field>
        </div>
        <Field id="d-website" label="Website" error={errors.website?.message}>
          <input id="d-website" type="url" className={CONTROL} placeholder="https://" {...register("website")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="d-instagramUrl" label="Instagram" error={errors.instagramUrl?.message}>
            <input id="d-instagramUrl" type="url" className={CONTROL} placeholder="https://" {...register("instagramUrl")} />
          </Field>
          <Field id="d-facebookUrl" label="Facebook" error={errors.facebookUrl?.message}>
            <input id="d-facebookUrl" type="url" className={CONTROL} placeholder="https://" {...register("facebookUrl")} />
          </Field>
          <Field id="d-twitterUrl" label="X (Twitter)" error={errors.twitterUrl?.message}>
            <input id="d-twitterUrl" type="url" className={CONTROL} placeholder="https://" {...register("twitterUrl")} />
          </Field>
          <Field id="d-tiktokUrl" label="TikTok" error={errors.tiktokUrl?.message}>
            <input id="d-tiktokUrl" type="url" className={CONTROL} placeholder="https://" {...register("tiktokUrl")} />
          </Field>
        </div>
      </Group>

      <Group title="Good to know">
        <Field id="d-parkingInfo" label="Parking" error={errors.parkingInfo?.message}>
          <input id="d-parkingInfo" className={CONTROL} maxLength={300} {...register("parkingInfo")} />
        </Field>
        <Field id="d-accessibilityInfo" label="Accessibility" error={errors.accessibilityInfo?.message}>
          <input id="d-accessibilityInfo" className={CONTROL} maxLength={300} {...register("accessibilityInfo")} />
        </Field>
      </Group>

      <Button type="submit" loading={saving} className="w-full sm:w-auto">Save changes</Button>
    </form>
  );
}
