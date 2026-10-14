export default function EmptyState({ title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{children}</p>}
    </div>
  );
}
