"use client";

import { useSyncExternalStore } from "react";
import { getOpenStatus } from "@/lib/hours";
import { cn } from "@/lib/utils/cn";

const subscribe = (cb) => { const id = setInterval(cb, 60_000); return () => clearInterval(id); };
const minuteNow = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

const TONE = {
  open: "text-emerald-400", closing_soon: "text-amber-400", closed: "text-ink-soft",
  temporarily_closed: "text-red-400", permanently_closed: "text-red-400", unknown: "text-ink-faint",
};
const DOT = {
  open: "bg-emerald-500", closing_soon: "bg-amber-500", closed: "bg-ink-faint",
  temporarily_closed: "bg-red-500", permanently_closed: "bg-red-500", unknown: "bg-ink-faint/50",
};

// The server renders a first guess, then the browser recomputes with the real
// current time and keeps it fresh each minute. That way a cached page never
// shows a stale "Open now".
export default function OpenStatus({ schedule, initial, className }) {
  const minute = useSyncExternalStore(subscribe, minuteNow, serverMinute);
  const status = minute === null ? initial : getOpenStatus(schedule, new Date(minute * 60_000));
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", TONE[status.state], className)}>
      <span className={cn("h-2 w-2 rounded-full", DOT[status.state])} aria-hidden="true" />
      {status.label}
    </span>
  );
}
