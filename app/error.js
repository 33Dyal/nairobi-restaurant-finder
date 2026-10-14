"use client";

import Button from "@/components/ui/Button";

export default function GlobalError({ reset }) {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">We couldn&apos;t load this page. Check your connection and try again.</p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </section>
  );
}
