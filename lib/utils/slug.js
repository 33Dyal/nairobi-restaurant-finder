export function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Returns a slug not yet used. `exists(slug)` must resolve to true if taken.
export async function uniqueSlug(base, exists) {
  const root = slugify(base) || "item";
  let slug = root;
  let n = 2;
  while (await exists(slug)) slug = `${root}-${n++}`;
  return slug;
}
