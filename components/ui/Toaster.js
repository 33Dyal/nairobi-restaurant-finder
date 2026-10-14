"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useToastStore } from "@/stores/toast";
import { cn } from "@/lib/utils/cn";

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    // reducedMotion="user" turns off the slide animation for people who ask their system for less motion.
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg",
                t.type === "error" ? "border-red-900" : "border-line"
              )}
            >
              {t.type === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-jacaranda-600" aria-hidden="true" />}
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-ink-faint hover:text-ink">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
