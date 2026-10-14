import { ImageResponse } from "next/og";

// Default share image for pages that don't have their own (for example the homepage).
export const alt = "Nairobi Eats";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#000000",
          color: "#f5f5f5",
        }}
      >
        <div style={{ fontSize: 30, color: "#f2b632", marginBottom: 24 }}>Nairobi restaurant finder</div>
        <div style={{ fontSize: 108, fontWeight: 800 }}>Nairobi Eats</div>
        <div style={{ fontSize: 38, color: "#a3a3a3", marginTop: 28, maxWidth: 900 }}>
          Find restaurants by cuisine, area, budget and vibe.
        </div>
      </div>
    ),
    { ...size },
  );
}
