// Opening-hours logic shared by cards, profiles and filters.
//
// A schedule looks like:
//   { operatingStatus: "OPEN" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED",
//     periods: [[dayOfWeek 0-6 (0 = Sunday), "HH:mm" opens, "HH:mm" closes], ...],
//     special: [{ date: "YYYY-MM-DD", closed: bool, opens, closes }] }
//
// A day can have several periods. A period whose closing time is not after its
// opening time runs past midnight into the next day. A special-hours entry
// replaces that date's weekly periods completely.

export const DEFAULT_TZ = "Africa/Nairobi";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localParts(now, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const dayOfWeek = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();
const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function interval(opens, closes) {
  const start = toMinutes(opens);
  let end = toMinutes(closes);
  if (end <= start) end += 1440;
  return [start, end];
}

function intervalsFor(schedule, dateStr) {
  const special = schedule.special?.find((s) => s.date === dateStr);
  if (special) return special.closed || !special.opens || !special.closes ? [] : [interval(special.opens, special.closes)];
  const dow = dayOfWeek(dateStr);
  return (schedule.periods ?? []).filter((p) => p[0] === dow).map((p) => interval(p[1], p[2])).sort((a, b) => a[0] - b[0]);
}

export function formatClock(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h24 < 12 ? "AM" : "PM"}`;
}

const result = (state, label) => ({ state, label, isOpen: state === "open" || state === "closing_soon" });

export function getOpenStatus(schedule, now = new Date(), tz = DEFAULT_TZ) {
  const op = schedule?.operatingStatus;
  if (op === "PERMANENTLY_CLOSED") return result("permanently_closed", "Permanently closed");
  if (op === "TEMPORARILY_CLOSED") return result("temporarily_closed", "Temporarily closed");

  const hasHours = schedule?.periods?.length || schedule?.special?.some((s) => !s.closed);
  if (!hasHours) return result("unknown", "Hours not listed");

  const { date, minutes } = localParts(now, tz);
  const today = intervalsFor(schedule, date);
  // Yesterday's late-night period may still be running after midnight.
  const spill = intervalsFor(schedule, addDays(date, -1)).filter(([, end]) => end > 1440).map(([s, e]) => [s - 1440, e - 1440]);

  const current = [...spill, ...today].find(([s, e]) => minutes >= s && minutes < e);
  if (current) {
    const closesIn = current[1] - minutes;
    return closesIn <= 60
      ? result("closing_soon", `Closes soon · ${formatClock(current[1] % 1440)}`)
      : result("open", `Open · closes ${formatClock(current[1] % 1440)}`);
  }

  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(date, offset);
    const next = intervalsFor(schedule, day).find(([s]) => offset > 0 || s > minutes);
    if (!next) continue;
    const when = formatClock(next[0]);
    if (offset === 0) return result("closed", `Closed · opens ${when}`);
    if (offset === 1) return result("closed", `Closed · opens tomorrow ${when}`);
    return result("closed", `Closed · opens ${DAYS[dayOfWeek(day)]} ${when}`);
  }
  return result("closed", "Closed");
}
