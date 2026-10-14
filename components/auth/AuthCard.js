export default function AuthCard({ title, description, children, footer }) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="mt-2 text-ink-soft">{description}</p>}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-7">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
    </section>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return <p role="alert" className="mb-4 rounded-lg border border-red-900 bg-red-950 px-3 py-2.5 text-sm text-red-300">{children}</p>;
}

export function FormNotice({ children }) {
  return <p role="status" className="rounded-lg border border-jacaranda-100 bg-jacaranda-50 px-3 py-2.5 text-sm text-jacaranda-700">{children}</p>;
}
