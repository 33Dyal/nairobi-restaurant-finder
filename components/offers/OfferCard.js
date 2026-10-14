import Link from "next/link";
import { Tag } from "lucide-react";
import { formatShortDate } from "@/lib/format";

// Machine-readable date for <time>; undefined (so the attribute is left out) if the value isn't a valid date.
const isoDate = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
};

// headingLevel: use 2 when the card sits directly under the page's <h1>, otherwise 3.
export default function OfferCard({ offer, headingLevel = 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-lg">
      <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-jacaranda-50 px-2.5 py-1 text-xs font-semibold text-jacaranda-700">
        <Tag className="h-3.5 w-3.5" aria-hidden="true" />Offer
      </span>
      <Heading className="font-display text-lg font-bold leading-snug">
        <Link href={`/restaurants/${offer.restaurantSlug}`} className="after:absolute after:inset-0 after:content-['']">{offer.title}</Link>
      </Heading>
      <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{offer.description}</p>
      <p className="mt-auto pt-4 text-xs text-ink-soft">
        <span className="font-medium text-ink">{offer.restaurantName}</span> {"\u00B7"} {offer.areaName}
        <span className="block pt-0.5">Valid until <time dateTime={isoDate(offer.endsAt)}>{formatShortDate(offer.endsAt)}</time></span>
      </p>
    </article>
  );
}
