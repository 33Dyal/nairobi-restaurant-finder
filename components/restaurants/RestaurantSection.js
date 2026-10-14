import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RestaurantCard from "./RestaurantCard";

export default function RestaurantSection({ title, subtitle, href, items }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-1 text-ink-soft">{subtitle}</p>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-jacaranda-700 hover:underline">
          See all <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((r) => <RestaurantCard key={r.id} r={r} />)}
      </div>
    </section>
  );
}