export const PRICE_LABELS = {
  BUDGET: "Budget",
  MODERATE: "Moderate",
  MID_RANGE: "Mid-range",
  PREMIUM: "Premium",
  LUXURY: "Luxury",
};

// 1 to 5, shown as that many "KSh" marks next to the label.

export const PRICE_KES = {
  BUDGET: "Under KSh 1,000",
  MODERATE: "KSh 1,000–2,000",
  MID_RANGE: "KSh 2,000–3,500",
  PREMIUM: "KSh 3,500–6,000",
  LUXURY: "KSh 6,000+",
};

export const RATING_OPTIONS = [
  { value: "4.5", label: "4.5 and up" },
  { value: "4", label: "4.0 and up" },
  { value: "3.5", label: "3.5 and up" },
  { value: "3", label: "3.0 and up" },
];

export const EVENT_CATEGORY_LABELS = {
  LIVE_MUSIC: "Live music",
  DJ_NIGHT: "DJ night",
  FOOD_FESTIVAL: "Food festival",
  THEMED_NIGHT: "Themed night",
  COMEDY: "Comedy",
  CULTURAL: "Cultural",
  SPECIAL_DINING: "Special dining",
  SPORTS_VIEWING: "Sports viewing",
  OTHER: "Event",
};

// Example searches shown on the homepage. Phase 5 teaches the search to understand them.
export const SEARCH_EXAMPLES = [
  { label: "Romantic restaurants", href: "/explore?q=romantic" },
  { label: "Rooftop restaurants", href: "/explore?vibe=rooftop" },
  { label: "Nyama choma", href: "/explore?q=nyama%20choma" },
  { label: "Vegan restaurants", href: "/explore?cuisine=vegan" },
  { label: "Open now", href: "/explore?open=1" },
  { label: "Affordable in Nairobi", href: "/explore?price=BUDGET" },
];
