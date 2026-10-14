"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so it must only load in the browser.
// `ssr: false` is only allowed inside a Client Component, hence this wrapper.
const RestaurantMap = dynamic(() => import("./RestaurantMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[70vh] min-h-[420px] animate-pulse rounded-2xl border border-line bg-surface"
      role="status"
      aria-label="Loading map"
    />
  ),
});

export default function MapLoader({ restaurants }) {
  return <RestaurantMap restaurants={restaurants} />;
}