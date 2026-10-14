import { EVENT_CATEGORY_LABELS } from "@/lib/constants/labels";

const TZ = "Africa/Nairobi";

export function formatRating(average, count) {
  if (!count) return { text: "New", isNew: true };
  return { text: (Math.round(average * 10) / 10).toFixed(1), isNew: false };
}

export function formatReviewCount(count) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(date));
}

export function formatEventWhen(date) {
  const d = new Date(date);
  const day = new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "numeric", month: "short", timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("en-KE", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ }).format(d);
  return `${day} · ${time.toUpperCase()}`;
}

export const eventCategoryLabel = (c) => EVENT_CATEGORY_LABELS[c] ?? EVENT_CATEGORY_LABELS.OTHER;
