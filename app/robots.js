import { siteUrl, isIndexable } from "@/lib/seo";

// Pages that are private, need a sign-in, or are only useful to the signed-in person.
const PRIVATE = [
  "/api/",
  "/admin",
  "/owner",
  "/account",
  "/favorites",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/refresh-session",
  "/forbidden",
  "/explore?*", // filtered and sorted views; /explore itself stays crawlable
];

export default function robots() {
  // Only a real production domain is crawlable. Everything else is blocked.
  if (!isIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
