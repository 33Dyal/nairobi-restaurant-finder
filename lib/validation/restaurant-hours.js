import { z } from "zod";

// Matches lib/hours.js: day 0-6 with 0 = Sunday, times as "HH:mm" (24-hour).
// A period that ends at or before its start runs past midnight (18:00 to 02:00).
// Equal times (00:00 to 00:00) mean open for 24 hours.
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Today's date in Nairobi as YYYY-MM-DD (en-CA formats dates that way).
export const todayInNairobi = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());

const period = z.object({
  day: z.number().int().min(0).max(6),
  opens: z.string().regex(TIME, "Enter a valid opening time."),
  closes: z.string().regex(TIME, "Enter a valid closing time."),
});

const specialDay = z
  .object({
    date: z
      .string()
      .regex(DATE, "Enter a valid date.")
      .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), "Enter a valid date."),
    type: z.enum(["SPECIAL", "HOLIDAY"]),
    label: z
      .string()
      .trim()
      .max(60, "Keep the label under 60 characters.")
      .nullish()
      .transform((v) => v || null),
    closed: z.boolean(),
    opens: z.string().nullish(),
    closes: z.string().nullish(),
  })
  .superRefine((v, ctx) => {
    if (v.closed) return;
    if (!v.opens || !TIME.test(v.opens) || !v.closes || !TIME.test(v.closes)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter opening and closing times, or mark the day as closed.",
        path: ["opens"],
      });
    }
  });

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const restaurantHoursSchema = z
  .object({
    periods: z.array(period).max(28, "That's too many opening periods."),
    special: z.array(specialDay).max(60, "That's too many special days."),
  })
  .superRefine((value, ctx) => {
    // Periods on the same day must not overlap.
    const byDay = new Map();
    for (const p of value.periods) {
      const start = toMinutes(p.opens);
      let end = toMinutes(p.closes);
      if (end <= start) end += 1440;
      byDay.set(p.day, [...(byDay.get(p.day) ?? []), [start, end]]);
    }
    for (const [day, list] of byDay) {
      list.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < list.length; i++) {
        if (list[i][0] < list[i - 1][1]) {
          ctx.addIssue({ code: "custom", message: `Opening periods overlap on ${DAY_NAMES[day]}.`, path: ["periods"] });
          break;
        }
      }
    }

    // One entry per date.
    const seen = new Set();
    for (const s of value.special) {
      if (seen.has(s.date)) {
        ctx.addIssue({ code: "custom", message: `${s.date} is listed twice.`, path: ["special"] });
        break;
      }
      seen.add(s.date);
    }
  });