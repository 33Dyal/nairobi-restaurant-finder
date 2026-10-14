import FavoriteButton from "./FavoriteButton";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star, Tag } from "lucide-react";
import OpenStatus from "./OpenStatus";
import { getOpenStatus } from "@/lib/hours";
import { PRICE_LABELS, PRICE_KES } from "@/lib/constants/labels";
import { formatRating, formatReviewCount } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

export function PriceRange({ value }) {
  if (!PRICE_KES[value]) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-semibold text-ink">{PRICE_KES[value]}</span>
      <span className="text-ink-faint">{"\u00B7"} {PRICE_LABELS[value]}</span>
    </span>
  );
}

// Reusable everywhere restaurants are listed (home, explore, map, favorites,
// recommendations, recently viewed, comparison). `actions` is a slot for
// buttons such as Favorite and Compare, placed above the card's main link.
// `distanceKm` is optional and shown only when the caller knows it.
// `headingLevel`: use 2 when the card sits directly under the page's <h1>, otherwise 3.
export default function RestaurantCard({ restaurant: r, actions, distanceKm, className, priority = false, headingLevel = 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const rating = formatRating(r.rating.average, r.rating.count);
  const cuisine = r.cuisines.slice(0, 2).join(" \u00B7 ");

  return (
    <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-lg", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-jacaranda-100">
        {r.coverUrl ? (
          <Image
            src={r.coverUrl} alt="" fill priority={priority} sizes="(min-width: 1024px) 280px, 270px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-jacaranda-100 to-jacaranda-500/40" aria-hidden="true" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {r.isFeatured && <span className="rounded-full bg-lantern px-2.5 py-1 text-[11px] font-bold text-black">Featured</span>}
          {r.offerTitle && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-jacaranda-700">
              <Tag className="h-3 w-3" aria-hidden="true" />Offer
            </span>
          )}
        </div>
        {r.isDemo && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">Sample listing</span>
        )}
        <div className="absolute right-3 top-3 z-10 flex gap-1.5">
          {actions}
          <FavoriteButton restaurantId={r.id} name={r.name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <Heading className="font-display text-lg font-bold leading-snug">
            <Link href={`/restaurants/${r.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
              {r.name}
            </Link>
            {r.verified && (
              <>
                <BadgeCheck className="ml-1 inline h-4 w-4 -translate-y-px text-jacaranda-600" aria-hidden="true" />
                <span className="sr-only"> (verified)</span>
              </>
            )}
          </Heading>
          <p className="flex shrink-0 items-center gap-1 text-sm font-semibold">
            <Star className={cn("h-4 w-4", rating.isNew ? "text-ink-faint" : "fill-lantern text-lantern")} aria-hidden="true" />
            {/* A plain span can't carry an aria-label reliably, so the spoken text is separate. */}
            <span aria-hidden="true">{rating.text}</span>
            <span className="sr-only">{rating.isNew ? "No reviews yet" : `Rated ${rating.text} out of 5`}</span>
          </p>
        </div>

        <p className="text-sm text-ink-soft">
          {cuisine}
          {!rating.isNew && <span className="text-ink-faint"> {"\u00B7"} {formatReviewCount(r.rating.count)}</span>}
        </p>

        {r.shortDescription && <p className="line-clamp-2 text-sm text-ink-soft">{r.shortDescription}</p>}

        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-xs text-ink-soft">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {r.areaName}
            {typeof distanceKm === "number" && <span> {"\u00B7"} {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away</span>}
          </p>
          <p><PriceRange value={r.priceRange} /></p>
          <OpenStatus schedule={r.schedule} initial={getOpenStatus(r.schedule)} />
        </div>
      </div>
    </article>
  );
}
