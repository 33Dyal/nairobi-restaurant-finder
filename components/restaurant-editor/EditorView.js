import Link from "next/link";
import DetailsForm from "./DetailsForm";
import CategoriesForm from "./CategoriesForm";
import HoursForm from "./HoursForm";
import { getCategoryEditorData, getHoursEditorData } from "@/lib/data/editor";

const STATUS = {
  PENDING: { label: "Awaiting approval", cls: "bg-amber-500/15 text-amber-300" },
  APPROVED: { label: "Live", cls: "bg-emerald-500/15 text-emerald-300" },
  REJECTED: { label: "Not approved", cls: "bg-red-500/15 text-red-300" },
};

const SECTIONS = [
  ["details", "Details"],
  ["categories", "Cuisines, vibes and amenities"],
  ["hours", "Opening hours"],
];

function Card({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-xl border border-line bg-surface p-5" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="mb-5 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// Server component. Both /owner/restaurants/[id] and /admin/restaurants/[id] render this,
// so the editor is built once and each page only decides who may open it.
// It loads the category and hours data itself, so the pages don't need to change.
export default async function EditorView({ restaurant, areas, backHref, backLabel }) {
  const [categories, hours] = await Promise.all([
    getCategoryEditorData(restaurant.id),
    getHoursEditorData(restaurant.id),
  ]);
  const status = STATUS[restaurant.approvalStatus];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-ink-soft hover:underline">&larr; {backLabel}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
        </div>
        {restaurant.approvalStatus === "APPROVED" ? (
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-lantern hover:underline">
            View public page<span className="sr-only"> (opens in a new tab)</span>
          </Link>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">This listing is not visible on the site until it is approved.</p>
        )}
      </div>

      <nav aria-label="Sections" className="flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-surface">{label}</a>
        ))}
      </nav>

      <Card id="details" title="Details">
        <DetailsForm restaurant={restaurant} areas={areas} />
      </Card>

      <Card id="categories" title="Cuisines, vibes and amenities">
        <CategoriesForm restaurantId={restaurant.id} options={categories.options} selected={categories.selected} />
      </Card>

      <Card id="hours" title="Opening hours">
        <HoursForm restaurantId={restaurant.id} initial={hours} />
      </Card>

      <p className="text-sm text-ink-soft">Photos and the menu are added in the next steps.</p>
    </div>
  );
}
