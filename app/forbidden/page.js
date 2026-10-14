import Link from "next/link";

export const metadata = { title: "No access", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">You don&apos;t have access to this page</h1>
      <p className="mt-3 text-ink-soft">Your account doesn&apos;t have the permissions this page needs. If you manage a restaurant, claim your listing to get access.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-jacaranda-600 px-5 text-sm font-semibold text-black hover:bg-jacaranda-700">Back to home</Link>
    </section>
  );
}
