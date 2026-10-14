"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import RecommendChat from "@/components/ai/RecommendChat";

// Floating button (bottom right) that opens the restaurant recommendation chat.
// The panel stays mounted while closed, so the conversation is kept if the
// visitor closes and reopens it.
export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keyboard users: move focus into the chat when it opens, and back to the button when it closes.
  useEffect(() => {
    if (open) panelRef.current?.querySelector("input")?.focus();
    else if (wasOpen.current) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <div
        ref={panelRef}
        id="ai-chat-panel"
        role="dialog"
        aria-modal="false"
        aria-label="Restaurant recommendations"
        className={`${open ? "flex" : "hidden"} fixed bottom-24 right-4 z-50 max-h-[75vh] w-[min(92vw,26rem)] flex-col overflow-hidden rounded-2xl border border-line bg-neutral-950 text-neutral-100 shadow-2xl sm:right-6`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Find a place to eat
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="rounded-md p-1 text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <RecommendChat compact />
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ai-chat-panel"
        aria-label={open ? "Close restaurant assistant" : "Open restaurant assistant"}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Sparkles className="h-6 w-6" aria-hidden="true" />}
      </button>
    </>
  );
}
