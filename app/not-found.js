import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-ink-soft">It may have moved, or the restaurant may no longer be listed.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-jacaranda-600 px-5 text-sm font-semibold text-black hover:bg-jacaranda-700">Back to home</Link>
        <Link href="/explore" className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold hover:bg-paper">Explore restaurants</Link>
      </div>
    </section>
  );
}
