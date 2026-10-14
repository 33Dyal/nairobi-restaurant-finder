/* Pure, deterministic seed data builder (no database access).
   Everything here is SAMPLE DATA: fictional restaurants, fake contact details,
   and example.com accounts. Restaurants carry isDemo = true. */

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CITY = { name: "Nairobi", slug: "nairobi", country: "KE", latitude: -1.2921, longitude: 36.8219 };

// Approximate area centres (sample values, not survey-grade).
const AREAS = [
  ["Westlands", -1.2673, 36.8116], ["Kilimani", -1.2899, 36.787], ["Lavington", -1.278, 36.77],
  ["Kileleshwa", -1.2743, 36.7846], ["Karen", -1.319, 36.7077], ["CBD", -1.2864, 36.8172],
  ["Parklands", -1.262, 36.816], ["Gigiri", -1.231, 36.804], ["Runda", -1.21, 36.804],
  ["Hurlingham", -1.296, 36.795], ["Upper Hill", -1.298, 36.813], ["South B", -1.31, 36.835],
  ["South C", -1.325, 36.82], ["Lang'ata", -1.35, 36.75], ["Ngong Road", -1.3, 36.77],
  ["Kasarani", -1.22, 36.899], ["Embakasi", -1.322, 36.895], ["Eastleigh", -1.273, 36.85],
  ["Ruaka", -1.205, 36.775],
].map(([name, latitude, longitude]) => ({ name, slug: slugify(name), latitude, longitude }));

const CUISINES = ["Kenyan", "Ethiopian", "Indian", "Chinese", "Japanese", "Korean", "Italian", "Mexican",
  "Continental", "African", "Seafood", "BBQ", "Steakhouse", "Vegetarian", "Vegan", "Fast Food", "Cafe",
  "Bakery", "Dessert", "Fusion"].map((name, i) => ({ name, slug: slugify(name), sortOrder: i }));

const VIBES = ["Romantic", "Casual", "Family-friendly", "Fine dining", "Rooftop", "Outdoor", "Business",
  "Nightlife", "Quiet", "Date night", "Group dining", "Fast casual"]
  .map((name, i) => ({ name, slug: slugify(name), sortOrder: i }));

const AMENITIES = [
  ["Outdoor seating", "FACILITY"], ["Parking", "FACILITY"], ["Wi-Fi", "FACILITY"],
  ["Wheelchair accessible", "FACILITY"], ["Pet-friendly", "FACILITY"], ["Kids-friendly", "FACILITY"],
  ["Private dining", "FACILITY"], ["Halal", "DIETARY"], ["Vegetarian options", "DIETARY"],
  ["Vegan options", "DIETARY"], ["Live music", "ENTERTAINMENT"], ["Sports viewing", "ENTERTAINMENT"],
  ["Live entertainment", "ENTERTAINMENT"],
].map(([name, category], i) => ({ name, slug: slugify(name).replace("wi-fi", "wifi"), category, sortOrder: i }));

const CUISINE_BLURB = {
  bbq: "Charcoal-grilled meats and sharing platters", kenyan: "Home-style Kenyan cooking",
  continental: "Seasonal continental plates", italian: "Wood-fired pizza and handmade pasta",
  japanese: "Sushi, robata and ramen", steakhouse: "Aged steaks and a serious wine list",
  indian: "North and South Indian classics", ethiopian: "Injera platters and slow-cooked stews",
  chinese: "Cantonese and Sichuan favourites", korean: "Korean BBQ and comfort dishes",
  mexican: "Tacos, margaritas and late nights", seafood: "Coastal-style fresh fish and prawns",
  vegan: "Plant-based cooking with no compromises", bakery: "Fresh bread, pastries and coffee",
  dessert: "Cakes, gelato and dessert flights", "fast-food": "Quick bites, burgers and fries",
  cafe: "Specialty coffee and light meals", african: "Swahili and pan-African flavours",
  fusion: "Creative cross-cultural plates",
};

// Menu templates: [category, [[item, price KES, description, dietary tags, spicy]]]
const MENU = {
  bbq: [["Grill", [["Nyama Choma (half kg)", 1100, "Charcoal-grilled goat with kachumbari and ugali", ["halal"], false], ["Chicken Quarter", 650, "Marinated and flame grilled", ["halal"], true], ["Mixed Grill Platter", 2400, "Beef, goat, chicken and sausages to share", ["halal"], false]]], ["Sides", [["Ugali", 120, "", ["vegan"], false], ["Kachumbari", 150, "Tomato, onion and chilli salad", ["vegan"], true], ["Sukuma Wiki", 180, "Sautéed collard greens", ["vegan"], false]]]],
  kenyan: [["Mains", [["Githeri Special", 350, "Maize and beans slow-cooked with vegetables", ["vegetarian"], false], ["Pilau with Beef", 450, "Spiced rice with tender beef", ["halal"], false], ["Tilapia Fry", 700, "Whole fried tilapia with ugali", [], false]]], ["Sides", [["Chapati (2)", 100, "", ["vegetarian"], false], ["Mukimo", 220, "Mashed potatoes, peas and greens", ["vegetarian"], false]]]],
  continental: [["Starters", [["Burrata & Tomato", 1300, "With basil oil and sourdough", ["vegetarian"], false], ["Beef Carpaccio", 1500, "Rocket, parmesan, capers", [], false]]], ["Mains", [["Pan-Seared Sea Bass", 2600, "Lemon butter, seasonal greens", ["gluten-free"], false], ["Herb-Crusted Lamb Rack", 3400, "Rosemary jus and dauphinoise", [], false], ["Wild Mushroom Risotto", 1900, "Truffle oil and parmesan", ["vegetarian"], false]]]],
  italian: [["Pizza", [["Margherita", 1100, "Tomato, mozzarella, basil", ["vegetarian"], false], ["Diavola", 1500, "Spicy salami and chilli oil", [], true], ["Quattro Formaggi", 1600, "Four-cheese white pizza", ["vegetarian"], false]]], ["Pasta", [["Spaghetti Carbonara", 1400, "Guanciale, egg, pecorino", [], false], ["Penne Arrabbiata", 1200, "Tomato and chilli", ["vegan"], true], ["Tiramisu", 750, "Classic house recipe", ["vegetarian"], false]]]],
  japanese: [["Sushi", [["Salmon Nigiri (2)", 900, "", ["gluten-free"], false], ["Dragon Roll", 1900, "Prawn tempura, avocado, eel sauce", [], false], ["Vegetable Maki", 1100, "Cucumber, avocado, carrot", ["vegan"], false]]], ["Hot Dishes", [["Tonkotsu Ramen", 1700, "Pork broth, noodles, soft egg", [], true], ["Chicken Katsu Curry", 1600, "Crumbed chicken, Japanese curry", [], false]]]],
  steakhouse: [["Steaks", [["Ribeye 300g", 4200, "Grass-fed, served with two sides", ["gluten-free"], false], ["Fillet 250g", 4600, "Peppercorn or mushroom sauce", [], false], ["Tomahawk to Share", 9800, "1kg bone-in for two", [], false]]], ["Sides", [["Truffle Fries", 850, "", ["vegetarian"], false], ["Creamed Spinach", 700, "", ["vegetarian"], false]]]],
  indian: [["Curries", [["Butter Chicken", 1300, "Tomato-cream gravy", ["halal"], false], ["Paneer Tikka Masala", 1200, "Charred paneer in spiced sauce", ["vegetarian"], true], ["Lamb Rogan Josh", 1600, "Kashmiri chilli and whole spices", ["halal"], true]]], ["Breads & Rice", [["Garlic Naan", 250, "", ["vegetarian"], false], ["Vegetable Biryani", 950, "Fragrant basmati with raita", ["vegetarian"], false]]]],
  ethiopian: [["Platters", [["Doro Wat", 1300, "Chicken stew with egg and injera", [], true], ["Beyainatu Veggie Platter", 1400, "Assorted vegan stews on injera", ["vegan"], false], ["Tibs Special", 1500, "Sautéed beef with peppers", [], false]]], ["Drinks", [["Ethiopian Coffee Ceremony", 400, "Served with incense", ["vegan"], false]]]],
  chinese: [["Mains", [["Sweet and Sour Chicken", 1100, "", [], false], ["Kung Pao Prawns", 1800, "Peanuts and dried chilli", [], true], ["Mapo Tofu", 950, "Sichuan pepper and chilli bean", ["vegetarian"], true]]], ["Noodles & Rice", [["Beef Chow Mein", 950, "", [], false], ["Egg Fried Rice", 650, "", ["vegetarian"], false]]]],
  korean: [["BBQ", [["Bulgogi Set", 1800, "Marinated beef with banchan", [], false], ["Samgyeopsal", 2100, "Grilled pork belly with lettuce wraps", [], false]]], ["Comfort", [["Kimchi Jjigae", 1300, "Fermented kimchi stew", [], true], ["Bibimbap", 1400, "Rice bowl with vegetables and egg", ["vegetarian"], true], ["Tteokbokki", 900, "Rice cakes in gochujang", ["vegetarian"], true]]]],
  mexican: [["Tacos", [["Al Pastor Tacos (3)", 1100, "Pineapple and coriander", [], true], ["Fish Tacos (3)", 1200, "Crispy fish and slaw", [], false], ["Veggie Tacos (3)", 950, "Black beans and avocado", ["vegan"], false]]], ["Drinks", [["Classic Margarita", 900, "", [], false], ["Horchata", 400, "", ["vegetarian"], false]]]],
  seafood: [["From the Sea", [["Grilled Prawns", 1900, "Garlic butter", ["gluten-free"], false], ["Fish Masala", 1300, "Coconut curry with rice", [], true], ["Calamari Rings", 1100, "Lemon aioli", [], false]]], ["Sides", [["Coconut Rice", 350, "", ["vegan"], false], ["Mixed Salad", 400, "", ["vegan"], false]]]],
  vegan: [["Bowls", [["Buddha Bowl", 1100, "Quinoa, roasted veg, tahini", ["vegan", "gluten-free"], false], ["Jackfruit Tacos", 1000, "Smoky pulled jackfruit", ["vegan"], true]]], ["Drinks & Sweets", [["Green Detox Juice", 450, "", ["vegan"], false], ["Raw Cacao Brownie", 500, "", ["vegan"], false], ["Oat Flat White", 350, "", ["vegan"], false]]]],
  bakery: [["Bakes", [["Butter Croissant", 220, "", ["vegetarian"], false], ["Sourdough Loaf", 450, "", ["vegan"], false], ["Cinnamon Roll", 280, "", ["vegetarian"], false]]], ["Coffee", [["Cappuccino", 300, "", ["vegetarian"], false], ["Iced Latte", 350, "", ["vegetarian"], false]]]],
  dessert: [["Desserts", [["Molten Chocolate Cake", 750, "With vanilla gelato", ["vegetarian"], false], ["Gelato Trio", 600, "", ["vegetarian"], false], ["Waffle Stack", 850, "Berries and cream", ["vegetarian"], false]]], ["Drinks", [["Hot Chocolate", 400, "", ["vegetarian"], false]]]],
  "fast-food": [["Burgers", [["Classic Beef Burger", 650, "", [], false], ["Spicy Chicken Burger", 600, "", [], true], ["Veggie Burger", 550, "", ["vegetarian"], false]]], ["Sides", [["Fries", 250, "", ["vegan"], false], ["Chicken Wings (6)", 550, "", [], true]]]],
  cafe: [["All Day", [["Avocado Toast", 650, "Poached egg, chilli flakes", ["vegetarian"], true], ["Club Sandwich", 800, "", [], false], ["Garden Salad", 600, "", ["vegan"], false]]], ["Coffee", [["Flat White", 320, "", ["vegetarian"], false], ["Kenyan Filter Coffee", 300, "", ["vegan"], false]]]],
  african: [["Coastal", [["Biryani ya Nyama", 650, "Swahili-style spiced rice", ["halal"], false], ["Samaki wa Nazi", 900, "Fish in coconut sauce", [], false], ["Mahamri & Beans", 300, "Cardamom doughnuts with coconut beans", ["vegan"], false]]], ["Drinks", [["Dawa", 450, "Honey, lime and ginger", ["vegan"], false]]]],
  fusion: [["Plates", [["Kenyan Tacos", 1000, "Nyama choma in soft tortillas", [], true], ["Miso Sukuma Bowl", 950, "Greens, miso dressing, sesame", ["vegan"], false], ["Tamarind Glazed Wings", 1100, "", [], true]]], ["Sweets", [["Mandazi Ice Cream Sandwich", 600, "", ["vegetarian"], false]]]],
};

// Restaurants: n=name, a=area, c=cuisines (first = primary), p=price, v=vibes, am=amenities,
// q=target quality (drives review ratings), f=featured, ver=verified
const R = (n, a, c, p, v, am, q, o = {}) => ({ n, a, c, p, v, am, q, ...o });
const RESTAURANTS = [
  R("Acacia Grill House", "westlands", ["bbq", "kenyan"], "MID_RANGE", ["casual", "group-dining", "outdoor"], ["outdoor-seating", "parking", "wifi", "halal", "kids-friendly"], 4.4, { f: true, ver: false, owner: true }),
  R("Jacaranda Rooftop Kitchen", "kilimani", ["continental", "fusion"], "PREMIUM", ["rooftop", "romantic", "date-night"], ["outdoor-seating", "wifi", "vegetarian-options", "live-music"], 4.6, { f: true, ver: true, owner: true }),
  R("Mama Wambui's Kitchen", "south-b", ["kenyan"], "BUDGET", ["casual", "family-friendly"], ["parking", "kids-friendly", "vegetarian-options"], 4.2, { ver: true }),
  R("Trattoria Kilima", "kilimani", ["italian"], "MID_RANGE", ["romantic", "date-night", "quiet"], ["wifi", "vegetarian-options", "vegan-options"], 4.5, { ver: true }),
  R("Sakura Bay", "westlands", ["japanese"], "PREMIUM", ["fine-dining", "business"], ["wifi", "wheelchair-accessible", "private-dining"], 4.3, { ver: true }),
  R("Savannah Steakhouse", "karen", ["steakhouse"], "LUXURY", ["fine-dining", "romantic"], ["parking", "private-dining", "wheelchair-accessible", "outdoor-seating"], 4.7, { f: true, ver: true }),
  R("Karen Garden Bistro", "karen", ["continental", "cafe"], "MODERATE", ["outdoor", "family-friendly", "quiet"], ["outdoor-seating", "parking", "pet-friendly", "kids-friendly", "wifi"], 4.1),
  R("Spice Route", "parklands", ["indian"], "MID_RANGE", ["family-friendly", "group-dining"], ["halal", "vegetarian-options", "parking", "kids-friendly"], 4.4, { ver: true }),
  R("Lalibela Table", "kileleshwa", ["ethiopian"], "MODERATE", ["casual", "group-dining"], ["vegetarian-options", "vegan-options", "wifi"], 4.3, { ver: true }),
  R("Dragon Pearl", "upper-hill", ["chinese"], "MID_RANGE", ["business", "group-dining"], ["parking", "private-dining", "halal"], 3.9, { closed: true }),
  R("Hanok House", "lavington", ["korean"], "MID_RANGE", ["casual", "date-night"], ["wifi", "vegetarian-options"], 4.2, { newest: true }),
  R("Casa Agave", "hurlingham", ["mexican"], "MODERATE", ["casual", "nightlife", "group-dining"], ["outdoor-seating", "live-music", "vegan-options"], 4.0),
  R("Coral Reef Seafood", "cbd", ["seafood"], "MID_RANGE", ["casual", "business"], ["halal", "wifi"], 4.0),
  R("Green Leaf Vegan", "kilimani", ["vegan", "vegetarian"], "MODERATE", ["quiet", "casual"], ["vegan-options", "vegetarian-options", "wifi", "pet-friendly", "outdoor-seating"], 4.5, { ver: true }),
  R("Sunrise Bakehouse", "lavington", ["bakery", "cafe"], "BUDGET", ["casual", "quiet"], ["wifi", "vegetarian-options", "outdoor-seating"], 4.3),
  R("Sweet Tooth Dessert Bar", "westlands", ["dessert"], "MODERATE", ["date-night", "casual"], ["wifi", "vegetarian-options", "kids-friendly"], 4.1),
  R("Quick Bite Express", "cbd", ["fast-food"], "BUDGET", ["fast-casual"], ["halal", "wifi"], 3.6),
  R("Runda Terrace", "runda", ["continental"], "LUXURY", ["fine-dining", "outdoor", "quiet"], ["outdoor-seating", "parking", "private-dining", "wheelchair-accessible"], 4.6, { ver: true }),
  R("Gigiri Courtyard Cafe", "gigiri", ["cafe"], "MODERATE", ["business", "quiet", "outdoor"], ["outdoor-seating", "wifi", "parking", "vegan-options"], 4.2),
  R("Ngong Road Nyama Joint", "ngong-road", ["bbq", "kenyan"], "BUDGET", ["casual", "group-dining", "nightlife"], ["sports-viewing", "live-entertainment", "halal"], 4.0),
  R("Langata Grill & Garden", "langata", ["bbq"], "MODERATE", ["family-friendly", "outdoor"], ["outdoor-seating", "parking", "kids-friendly", "halal"], 4.2),
  R("Kasarani Sports Bar & Grill", "kasarani", ["bbq", "fast-food"], "MODERATE", ["nightlife", "group-dining"], ["sports-viewing", "live-entertainment", "parking"], 3.9),
  R("Embakasi Swahili Flavours", "embakasi", ["african", "seafood"], "BUDGET", ["casual", "family-friendly"], ["halal", "parking", "kids-friendly"], 4.1),
  R("Eastleigh Spice House", "eastleigh", ["african", "indian"], "BUDGET", ["casual", "group-dining"], ["halal", "vegetarian-options"], 4.0),
  R("Ruaka Hillside Eatery", "ruaka", ["fusion"], "MODERATE", ["outdoor", "casual"], ["outdoor-seating", "parking"], 4.0, { approval: "PENDING" }),
  R("South C Noodle Lab", "south-c", ["chinese", "fusion"], "MODERATE", ["casual"], ["wifi", "vegetarian-options"], 4.0, { approval: "PENDING" }),
  R("Kileleshwa Wine & Tapas", "kileleshwa", ["continental"], "PREMIUM", ["date-night", "romantic", "nightlife"], ["wifi", "outdoor-seating"], 4.0, { approval: "REJECTED" }),
];

const PASSWORD_DEFAULT = "Demo@12345";
const REVIEW_TEXT = {
  5: ["Outstanding food and service. Would happily come back.", "Everything was fresh and well presented. A real highlight.", "Friendly team, lovely atmosphere and great value."],
  4: ["Really good overall. A couple of small things to improve, but we enjoyed it.", "Tasty food and a pleasant setting. Service was a little slow at peak time."],
  3: ["Decent meal but nothing memorable. Portions were fair.", "Good flavours, though the wait was long and it was noisy."],
  2: ["Food arrived lukewarm and the service felt rushed."],
};
const OWNER_REPLIES = ["Thank you for the kind words. We hope to see you again soon.", "Thanks for the feedback. We are working on service times and appreciate you flagging it."];

function hoursFor(r, primary) {
  const days = [0, 1, 2, 3, 4, 5, 6];
  const p = (d, o, c) => ({ dayOfWeek: d, opensAt: o, closesAt: c });
  if (r.v.includes("nightlife")) return days.flatMap((d) => [p(d, "12:00", d === 5 || d === 6 ? "02:00" : "23:00")]);
  if (primary === "cafe" || primary === "bakery") return days.map((d) => p(d, "07:00", "18:00"));
  if (r.p === "PREMIUM" || r.p === "LUXURY") return days.filter((d) => d !== 1).flatMap((d) => [p(d, "12:00", "15:00"), p(d, "18:00", "22:30")]);
  return days.map((d) => p(d, "11:00", "22:00"));
}

function buildSeedData(now = new Date()) {
  const rand = rng(20260930);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const day = 86400000;
  const year = now.getUTCFullYear();

  const users = [
    { key: "admin", email: "admin@example.com", name: "Demo Admin", role: "ADMIN" },
    { key: "owner", email: "owner@example.com", name: "Demo Owner", role: "OWNER" },
    { key: "customer", email: "customer@example.com", name: "Demo Customer", role: "CUSTOMER" },
    ...Array.from({ length: 8 }, (_, i) => ({ key: `rev${i + 1}`, email: `reviewer${i + 1}@example.com`, name: `Demo Reviewer ${i + 1}`, role: "CUSTOMER" })),
  ];
  const reviewerKeys = users.filter((u) => u.key.startsWith("rev")).map((u) => u.key);

  const restaurants = RESTAURANTS.map((r, i) => {
    const area = AREAS.find((a) => a.slug === r.a);
    const primary = r.c[0];
    const slug = slugify(r.n);
    const approval = r.approval || "APPROVED";
    const images = [["", "COVER"], ["-interior", "INTERIOR"], ["-food", "FOOD"]].map(([suffix, type], k) => ({
      url: `/demo/${primary}${suffix}.svg`, type, sortOrder: k, caption: `${r.n} (sample image)`,
    }));
    const approved = approval === "APPROVED";
    return {
      slug, name: r.n, areaSlug: r.a, cuisineSlugs: r.c, vibeSlugs: r.v, amenitySlugs: r.am,
      priceRange: r.p, quality: r.q, ownedByDemoOwner: !!r.owner, isDemo: true,
      shortDescription: `${CUISINE_BLURB[primary]} in ${area.name}.`,
      description: `${r.n} is a sample listing in ${area.name}, Nairobi, serving ${CUISINE_BLURB[primary].toLowerCase()}. This is demo data created for testing and is not a real restaurant.`,
      address: `Plot ${10 + i}, Sample Road, ${area.name}`,
      landmark: `Near ${area.name} sample landmark`,
      latitude: +(area.latitude + (rand() - 0.5) * 0.008).toFixed(6),
      longitude: +(area.longitude + (rand() - 0.5) * 0.008).toFixed(6),
      phone: `+254 700 000 ${String(100 + i)}`, email: `hello@${slug}.example`, website: `https://${slug}.example`,
      parkingInfo: r.am.includes("parking") ? "On-site parking available." : "Street parking nearby.",
      accessibilityInfo: r.am.includes("wheelchair-accessible") ? "Step-free entrance and accessible restrooms." : "Please call ahead for accessibility details.",
      approvalStatus: approval,
      verificationStatus: approval === "REJECTED" ? "REJECTED" : r.ver ? "VERIFIED" : "PENDING",
      operatingStatus: r.closed ? "TEMPORARILY_CLOSED" : "OPEN",
      isFeatured: !!r.f && approved,
      coverUrl: images[0].url,
      createdAt: new Date(now.getTime() - (r.newest ? 3 : 20 + i * 9) * day),
      images,
      openingPeriods: hoursFor(r, primary),
      menu: { name: "Main menu", categories: (MENU[primary] || MENU.continental).map(([name, items], ci) => ({
        name, sortOrder: ci,
        items: items.map(([iname, price, description, dietaryTags, isSpicy], ii) => ({ name: iname, price, description: description || null, dietaryTags, isSpicy, isFeatured: ii === 0, sortOrder: ii })),
      })) },
    };
  });

  // Reviews, helpful votes and owner replies (approved restaurants only).
  const reviews = [];
  restaurants.filter((r) => r.approvalStatus === "APPROVED").forEach((r) => {
    const n = 3 + Math.floor(rand() * 5);
    const authors = [...reviewerKeys, "customer"].sort(() => rand() - 0.5).slice(0, n);
    authors.forEach((userKey, k) => {
      const rating = Math.max(2, Math.min(5, Math.round(r.quality + (rand() - 0.5) * 1.6)));
      const voters = reviewerKeys.filter((v) => v !== userKey).sort(() => rand() - 0.5).slice(0, Math.floor(rand() * 4));
      reviews.push({
        restaurantSlug: r.slug, userKey, rating, body: pick(REVIEW_TEXT[rating]),
        createdAt: new Date(now.getTime() - (5 + Math.floor(rand() * 120)) * day),
        ownerResponse: r.ownedByDemoOwner && k < 2 ? pick(OWNER_REPLIES) : null,
        voterKeys: voters,
      });
    });
  });

  const offerDefs = [
    ["acacia-grill-house", "Weekday Lunch Special", "Nyama choma lunch plate with a soft drink, Monday to Friday."],
    ["jacaranda-rooftop-kitchen", "Sunset Happy Hour", "Two-for-one mocktails and small plates from 5pm to 7pm."],
    ["trattoria-kilima", "Pasta Tuesday", "Any pasta at a fixed price every Tuesday evening."],
    ["green-leaf-vegan", "New Autumn Menu", "Try our new seasonal bowls and desserts."],
    ["sunrise-bakehouse", "Breakfast Bundle", "Coffee and a pastry at a set price before 10am."],
    ["casa-agave", "Taco Night", "Discounted tacos every Thursday from 6pm."],
    ["savannah-steakhouse", "Chef's Tasting Experience", "Five-course tasting menu with optional wine pairing."],
    ["langata-grill-and-garden", "Family Weekend Platter", "Sharing platter for four with kids' drinks included."],
  ];
  const offers = offerDefs.map(([restaurantSlug, title, description], i) => ({
    restaurantSlug, title, description, terms: "Sample offer for demo purposes. Terms vary by restaurant.",
    startsAt: new Date(now.getTime() - 5 * day), endsAt: new Date(now.getTime() + (25 + i * 4) * day),
    isFeatured: i < 3, contactInfo: "Call the restaurant for details.", imageUrl: null, status: "APPROVED",
  }));

  const eventDefs = [
    ["jacaranda-rooftop-kitchen", "Rooftop Jazz Evening", "LIVE_MUSIC"],
    ["casa-agave", "DJ Night: Afro House", "DJ_NIGHT"],
    ["acacia-grill-house", "Nyama Choma Festival Weekend", "FOOD_FESTIVAL"],
    ["kasarani-sports-bar-and-grill", "Match Day Screening", "SPORTS_VIEWING"],
    ["ngong-road-nyama-joint", "Open Mic Comedy Night", "COMEDY"],
    ["lalibela-table", "Ethiopian Coffee Ceremony Evening", "CULTURAL"],
    ["savannah-steakhouse", "Winemaker's Dinner", "SPECIAL_DINING"],
    ["green-leaf-vegan", "Plant-Based Supper Club", "THEMED_NIGHT"],
  ];
  const events = eventDefs.map(([restaurantSlug, title, category], i) => {
    const start = new Date(now.getTime() + (3 + i * 5) * day); start.setUTCHours(16, 0, 0, 0);
    return { restaurantSlug, title, category, description: `${title}. Sample event for demo purposes.`, startsAt: start, endsAt: new Date(start.getTime() + 4 * 3600000), externalUrl: i % 3 === 0 ? "https://events.example/sample" : null, isPublished: true, status: "APPROVED" };
  });

  const specialHours = ["acacia-grill-house", "jacaranda-rooftop-kitchen", "trattoria-kilima", "sakura-bay"].flatMap((restaurantSlug) => [
    { restaurantSlug, date: new Date(Date.UTC(year + (now.getUTCMonth() === 11 && now.getUTCDate() > 25 ? 1 : 0), 11, 25)), type: "HOLIDAY", label: "Christmas Day", isClosed: true },
    { restaurantSlug, date: new Date(Date.UTC(year + 1, 0, 1)), type: "HOLIDAY", label: "New Year's Day", isClosed: false, opensAt: "14:00", closesAt: "22:00" },
  ]);

  const searchTerms = ["nyama choma", "pizza kilimani", "romantic restaurants", "rooftop", "vegan", "affordable restaurants", "japanese westlands", "open now", "brunch", "coffee"];
  const searches = Array.from({ length: 60 }, () => {
    const q = pick(searchTerms);
    return { query: q, normalized: q, resultCount: 1 + Math.floor(rand() * 12), createdAt: new Date(now.getTime() - Math.floor(rand() * 30) * day) };
  });

  const analytics = [];
  const types = ["PROFILE_VIEW", "PROFILE_VIEW", "PROFILE_VIEW", "MENU_VIEW", "SEARCH_IMPRESSION", "SEARCH_IMPRESSION", "SEARCH_CLICK", "DIRECTIONS_CLICK", "CALL_CLICK"];
  const sources = ["search", "explore", "map", "home", "direct", "share"];
  restaurants.filter((r) => r.approvalStatus === "APPROVED").forEach((r) => {
    const count = 40 + Math.floor(rand() * 80);
    for (let k = 0; k < count; k++) {
      analytics.push({ restaurantSlug: r.slug, type: pick(types), source: pick(sources), createdAt: new Date(now.getTime() - Math.floor(rand() * 30 * day)) });
    }
  });

  return {
    city: CITY, areas: AREAS, cuisines: CUISINES, vibes: VIBES, amenities: AMENITIES,
    users, password: process.env.SEED_PASSWORD || PASSWORD_DEFAULT,
    restaurants, reviews, offers, events, specialHours, searches, analytics,
    favorites: ["jacaranda-rooftop-kitchen", "trattoria-kilima", "savannah-steakhouse", "green-leaf-vegan"],
    recentlyViewed: ["sakura-bay", "spice-route", "acacia-grill-house"],
    savedLocations: [{ label: "Home", areaSlug: "kilimani" }, { label: "Work", areaSlug: "westlands" }],
  };
}

module.exports = { buildSeedData, slugify };
