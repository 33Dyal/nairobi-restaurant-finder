"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils/cn";

export default function FavoriteButton({ restaurantId, name }) {
  const router = useRouter();
  const { signedIn, isSaved, toggle } = useFavorites();
  const saved = isSaved(restaurantId);

  function onClick(event) {
    // The card is one big link; don't navigate when the heart is clicked.
    event.preventDefault();
    event.stopPropagation();

    if (signedIn === null) return; // still checking who's signed in
    if (signedIn === false) {
      const here = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    toggle(restaurantId, {
      onSettled: () => {
        // On the favorites page, drop the card that was just unsaved.
        if (window.location.pathname === "/favorites") router.refresh();
      },
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      // The label stays the same and aria-pressed carries the state, so screen readers
      // announce "Save X to favorites, toggle button, pressed" and not a contradiction.
      aria-pressed={saved}
      aria-label={`Save ${name} to favorites`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 shadow transition hover:scale-105 focus-visible:outline focus-visible:outline-2"
    >
      <Heart className={cn("h-5 w-5", saved ? "fill-red-500 text-red-500" : "text-ink")} aria-hidden="true" />
    </button>
  );
}
