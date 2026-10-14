import { describe, it, expect } from "vitest";
import { getOpenStatus, formatClock } from "@/lib/hours";

// Nairobi is UTC+3 all year. Dates below: Thu 1 Oct 2026, so Wed = 30 Sep, Mon = 5 Oct.
const at = (iso) => new Date(iso);
const days = (list, o, c) => list.map((d) => [d, o, c]);

// Fine dining: closed Mondays, lunch 12-3 PM and dinner 6-10:30 PM otherwise.
const fine = {
  operatingStatus: "OPEN",
  periods: [0, 2, 3, 4, 5, 6].flatMap((d) => [[d, "12:00", "15:00"], [d, "18:00", "22:30"]]),
  special: [],
};
// Bar: 12-11 PM, but Fridays and Saturdays run until 2 AM.
const bar = {
  operatingStatus: "OPEN",
  periods: [...days([0, 1, 2, 3, 4], "12:00", "23:00"), ...days([5, 6], "12:00", "02:00")],
  special: [],
};

describe("getOpenStatus", () => {
  it("is open mid-period and says when it closes", () => {
    const s = getOpenStatus(fine, at("2026-09-30T10:00:00Z")); // Wed 1 PM
    expect(s).toMatchObject({ state: "open", isOpen: true, label: "Open · closes 3 PM" });
  });

  it("warns within the last hour", () => {
    const s = getOpenStatus(fine, at("2026-09-30T11:30:00Z")); // Wed 2:30 PM
    expect(s).toMatchObject({ state: "closing_soon", isOpen: true, label: "Closes soon · 3 PM" });
  });

  it("handles the gap between lunch and dinner", () => {
    const s = getOpenStatus(fine, at("2026-09-30T12:30:00Z")); // Wed 3:30 PM
    expect(s).toMatchObject({ state: "closed", isOpen: false, label: "Closed · opens 6 PM" });
  });

  it("says opens tomorrow after the last period of the day", () => {
    expect(getOpenStatus(fine, at("2026-09-30T20:00:00Z")).label).toBe("Closed · opens tomorrow 12 PM"); // Wed 11 PM
  });

  it("handles a closed weekday", () => {
    expect(getOpenStatus(fine, at("2026-10-05T10:00:00Z")).label).toBe("Closed · opens tomorrow 12 PM"); // Mon 1 PM
  });

  it("names the day when the next opening is further away", () => {
    const sundayOnly = { operatingStatus: "OPEN", periods: [[0, "10:00", "16:00"]], special: [] };
    expect(getOpenStatus(sundayOnly, at("2026-10-01T10:00:00Z")).label).toBe("Closed · opens Sun 10 AM");
  });

  it("uses Nairobi time, not UTC", () => {
    // 21:30 UTC on Wednesday is 00:30 Thursday in Nairobi, so today is Thursday and it opens at noon.
    expect(getOpenStatus(fine, at("2026-09-30T21:30:00Z")).label).toBe("Closed · opens 12 PM");
  });

  it("keeps late-night periods open after midnight", () => {
    // Fri 2 Oct night: Sat 3 Oct 00:30 Nairobi is 21:30 UTC on Friday.
    expect(getOpenStatus(bar, at("2026-10-02T21:30:00Z"))).toMatchObject({ state: "open", label: "Open · closes 2 AM" });
    // Thursday night the bar closes at 11 PM, so it is closed at 00:30 Friday.
    expect(getOpenStatus(bar, at("2026-10-01T21:30:00Z")).isOpen).toBe(false);
  });

  it("honours holiday closures and special hours", () => {
    const xmas = { ...fine, special: [{ date: "2026-12-25", closed: true }] };
    expect(getOpenStatus(xmas, at("2026-12-25T10:00:00Z")).label).toBe("Closed · opens tomorrow 12 PM");
    const late = { ...fine, special: [{ date: "2026-12-31", closed: false, opens: "14:00", closes: "23:00" }] };
    expect(getOpenStatus(late, at("2026-12-31T10:00:00Z")).label).toBe("Closed · opens 2 PM"); // 1 PM, special replaces normal hours
  });

  it("closed-for-the-day special hours do not leak into the next morning", () => {
    const s = { ...bar, special: [{ date: "2026-10-02", closed: true }] };
    expect(getOpenStatus(s, at("2026-10-02T21:30:00Z")).isOpen).toBe(false);
  });

  it("temporary and permanent closure override the schedule", () => {
    expect(getOpenStatus({ ...fine, operatingStatus: "TEMPORARILY_CLOSED" }, at("2026-09-30T10:00:00Z"))).toMatchObject({ state: "temporarily_closed", isOpen: false });
    expect(getOpenStatus({ ...fine, operatingStatus: "PERMANENTLY_CLOSED" }, at("2026-09-30T10:00:00Z"))).toMatchObject({ state: "permanently_closed", isOpen: false });
  });

  it("does not claim a status when no hours are listed", () => {
    expect(getOpenStatus({ operatingStatus: "OPEN", periods: [], special: [] })).toMatchObject({ state: "unknown", label: "Hours not listed" });
    expect(getOpenStatus(undefined).state).toBe("unknown");
  });
});

describe("formatClock", () => {
  it("formats 12-hour times", () => {
    expect(formatClock(0)).toBe("12 AM");
    expect(formatClock(12 * 60)).toBe("12 PM");
    expect(formatClock(18 * 60 + 30)).toBe("6:30 PM");
    expect(formatClock(26 * 60)).toBe("2 AM");
  });
});
