import Link from "next/link";

// Big enough to tap comfortably (44px high). A disabled button is a span, so it is
// marked aria-disabled for screen readers.
const BUTTON = "inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium";

export default function Pagination({
  page = 1,
  totalPages,
  total,
  pageSize = 12,
  searchParams = {},
  basePath = "/explore",
}) {
  const pages = totalPages ?? (total ? Math.ceil(total / pageSize) : 1);
  const current = Number(page) || 1;

  if (pages <= 1) return null;

  const href = (p) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="flex items-center justify-center gap-4 py-8" aria-label="Pagination">
      {current > 1 ? (
        <Link href={href(current - 1)} rel="prev" className={`${BUTTON} hover:bg-surface`}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`${BUTTON} opacity-40`}>
          Previous
        </span>
      )}

      <span className="text-sm" aria-current="page">
        Page {current} of {pages}
      </span>

      {current < pages ? (
        <Link href={href(current + 1)} rel="next" className={`${BUTTON} hover:bg-surface`}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={`${BUTTON} opacity-40`}>
          Next
        </span>
      )}
    </nav>
  );
}
