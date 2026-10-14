import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";

const label = (p) => String(p ?? "").replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export default function RestaurantCard({ r }) {
  return (
    <Link href={`/restaurants/${r.slug}`} className="group block overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-jacaranda-100 to-jacaranda-50">
        {r.image && (
          <Image src={r.image} alt={r.name} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-tight">{r.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
            <Star className="h-4 w-4 fill-lantern text-lantern" aria-hidden="true" />
            {r.reviews ? r.rating.toFixed(1) : "New"}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {[r.area, r.cuisine, label(r.price)].filter(Boolean).join(" · ")}
        </p>
        {r.blurb && <p className="mt-2 line-clamp-2 text-sm text-ink-faint">{r.blurb}</p>}
      </div>
    </Link>
  );
}