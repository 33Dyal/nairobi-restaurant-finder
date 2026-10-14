"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { restaurantCreateSchema } from "@/lib/validation/owner";
import { apiFetch } from "@/lib/api-client";
import Button from "@/components/ui/Button";

const PRICE_OPTIONS = [
  ["BUDGET", "Budget"],
  ["MODERATE", "Moderate"],
  ["MID_RANGE", "Mid-range"],
  ["PREMIUM", "Premium"],
  ["LUXURY", "Luxury"],
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

export default function NewRestaurantForm({ areas }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(restaurantCreateSchema),
    defaultValues: {
      name: "",
      areaId: "",
      priceRange: "",
      address: "",
      landmark: "",
      phone: "",
      email: "",
      website: "",
      shortDescription: "",
      description: "",
    },
  });

  async function onSubmit(values) {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/owner/restaurants", { method: "POST", body: values });
      router.push("/owner?created=1");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {error && (
        <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-400">{error}</p>
      )}

      <Field id="f-name" label="Restaurant name" error={errors.name?.message}>
        <input id="f-name" className={CONTROL} autoComplete="organization" {...register("name")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="f-areaId" label="Area" error={errors.areaId?.message}>
          <select id="f-areaId" className={CONTROL} {...register("areaId")}>
            <option value="">Choose an area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>

        <Field id="f-priceRange" label="Price range" error={errors.priceRange?.message}>
          <select id="f-priceRange" className={CONTROL} {...register("priceRange")}>
            <option value="">Choose a price range</option>
            {PRICE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="f-address" label="Street address" error={errors.address?.message}>
        <input id="f-address" className={CONTROL} autoComplete="street-address" {...register("address")} />
      </Field>

      <Field id="f-landmark" label="Landmark (optional)" hint="For example, next to a mall or opposite a petrol station." error={errors.landmark?.message}>
        <input id="f-landmark" className={CONTROL} {...register("landmark")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="f-phone" label="Phone (optional)" error={errors.phone?.message}>
          <input id="f-phone" type="tel" className={CONTROL} autoComplete="tel" {...register("phone")} />
        </Field>
        <Field id="f-email" label="Email (optional)" error={errors.email?.message}>
          <input id="f-email" type="email" className={CONTROL} {...register("email")} />
        </Field>
      </div>

      <Field id="f-website" label="Website (optional)" error={errors.website?.message}>
        <input id="f-website" type="url" className={CONTROL} placeholder="https://" {...register("website")} />
      </Field>

      <Field id="f-shortDescription" label="One-line summary (optional)" hint="Shown on restaurant cards. Up to 160 characters." error={errors.shortDescription?.message}>
        <input id="f-shortDescription" className={CONTROL} maxLength={160} {...register("shortDescription")} />
      </Field>

      <Field id="f-description" label="About the restaurant (optional)" error={errors.description?.message}>
        <textarea id="f-description" rows={5} className={`${CONTROL} py-3`} maxLength={2000} {...register("description")} />
      </Field>

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">Submit for approval</Button>
    </form>
  );
}
