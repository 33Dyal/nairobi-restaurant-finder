"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { PRICE_LABELS } from "@/lib/constants/labels";

const NAIROBI_CENTER = [-1.2921, 36.8219];

// Inline pin so we don't depend on Leaflet's default marker image files,
// which break under Next.js bundling.
const pin = L.divIcon({
  className: "",
  html:
    '<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;' +
    "background:#e11d48;border:2px solid #fff;transform:rotate(-45deg);" +
    'box-shadow:0 2px 6px rgba(0,0,0,.5)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

function FitBounds({ restaurants }) {
  const map = useMap();
  useEffect(() => {
    if (!restaurants.length) return;
    map.fitBounds(restaurants.map((r) => [r.lat, r.lng]), { padding: [40, 40], maxZoom: 15 });
  }, [map, restaurants]);
  return null;
}

export default function RestaurantMap({ restaurants = [] }) {
  return (
    <div
      role="region"
      aria-label="Interactive map of restaurants. A list of the same restaurants follows the map."
      className="h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-line"
    >
      {/* scrollWheelZoom is off so scrolling the page with a mouse wheel doesn't get
          caught by the map. Zoom with the + and - buttons or the keyboard instead. */}
      <MapContainer
        center={NAIROBI_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "#111" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds restaurants={restaurants} />
        {restaurants.map((r) => (
          // title gives each pin a name for keyboard and screen-reader users
          <Marker key={r.id} position={[r.lat, r.lng]} icon={pin} title={r.name} alt={r.name}>
            <Popup>
              <div style={{ color: "#111", minWidth: 160 }}>
                <strong style={{ display: "block", fontSize: 14 }}>{r.name}</strong>
                <span style={{ display: "block", fontSize: 12, opacity: 0.75 }}>
                  {[r.areaName, PRICE_LABELS[r.priceRange]].filter(Boolean).join(" \u00B7 ")}
                </span>
                {r.reviewCount > 0 && (
                  <span style={{ display: "block", fontSize: 12, marginTop: 2 }}>
                    {"\u2605"} {r.rating.toFixed(1)} ({r.reviewCount})
                  </span>
                )}
                <Link
                  href={`/restaurants/${r.slug}`}
                  style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "#be123c" }}
                >
                  {"View restaurant \u2192"}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
