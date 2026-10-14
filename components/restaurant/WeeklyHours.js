import { DEFAULT_TZ, formatClock } from "@/lib/hours";
import { cn } from "@/lib/utils/cn";

const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // week starts on Monday

const clock = (t) => { const [h, m] = t.split(":").map(Number); return formatClock(h * 60 + m); };

export default function WeeklyHours({ periods, special }) {
  const today = SHORT.indexOf(new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: DEFAULT_TZ }).format(new Date()));
  const upcoming = special.filter((s) => s.date >= new Date().toISOString().slice(0, 10));

  if (!periods.length) return <p className="text-sm text-ink-soft">Opening hours haven&apos;t been listed yet.</p>;

  return (
    <div className="space-y-4">
      <dl className="divide-y divide-line text-sm">
        {ORDER.map((dow) => {
          const slots = periods.filter((p) => p[0] === dow).sort((a, b) => a[1].localeCompare(b[1]));
          return (
            <div key={dow} className={cn("flex justify-between gap-4 py-2", dow === today && "font-semibold text-ink")}>
              <dt>{NAMES[dow]}</dt>
              <dd className="text-right">
                {slots.length ? slots.map((s) => `${clock(s[1])} – ${clock(s[2])}`).join(", ") : <span className="text-ink-faint">Closed</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Special hours</h3>
          <ul className="mt-1 space-y-1 text-sm text-ink-soft">
            {upcoming.map((s) => (
              <li key={s.date}>
                {new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${s.date}T00:00:00Z`))}
                {s.label ? ` (${s.label})` : ""}: {s.closed || !s.opens ? "Closed" : `${clock(s.opens)} – ${clock(s.closes)}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}