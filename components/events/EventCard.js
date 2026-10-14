import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { eventCategoryLabel, formatEventWhen } from "@/lib/format";

// Machine-readable date for <time>; undefined (so the attribute is left out) if the value isn't a valid date.
const isoDate = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
};

// headingLevel: use 2 when the card sits directly under the page's <h1>, otherwise 3.
export default function EventCard({ event, headingLevel = 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-lg">
      <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-lantern/25 px-2.5 py-1 text-xs font-semibold text-ink">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{eventCategoryLabel(event.category)}
      </span>
      <Heading className="font-display text-lg font-bold leading-snug">
        <Link href={`/restaurants/${event.restaurantSlug}`} className="after:absolute after:inset-0 after:content-['']">{event.title}</Link>
      </Heading>
      <p className="mt-1 text-sm font-medium text-jacaranda-700">
        <time dateTime={isoDate(event.startsAt)}>{formatEventWhen(event.startsAt)}</time>
      </p>
      <p className="mt-auto pt-4 text-xs text-ink-soft">
        <span className="font-medium text-ink">{event.restaurantName}</span> {"\u00B7"} {event.areaName}
      </p>
    </article>
  );
}
