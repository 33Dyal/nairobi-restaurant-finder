import { cn } from "@/lib/utils/cn";

export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-ink-faint/15", className)} />;
}
