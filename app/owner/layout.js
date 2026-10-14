import OwnerNav from "@/components/owner/OwnerNav";

// Dashboards are never shown in search results.
export const metadata = { robots: { index: false, follow: false } };

// Role checks live inside each owner page (layouts don't re-run on client navigation).
export default function OwnerLayout({ children }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8">
      <aside className="lg:w-52 lg:shrink-0">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Owner</p>
        <OwnerNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
