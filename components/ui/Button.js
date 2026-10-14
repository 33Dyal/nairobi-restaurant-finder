import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const variants = {
  primary: "bg-jacaranda-600 text-black hover:bg-jacaranda-700",
  secondary: "border border-line bg-surface text-ink hover:bg-paper",
  ghost: "text-ink-soft hover:bg-paper hover:text-ink",
};

export default function Button({ variant = "primary", loading = false, className, children, disabled, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
