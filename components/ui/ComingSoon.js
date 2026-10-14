export default function ComingSoon({ title, phase }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-ink-soft">This page is built in {phase}.</p>
    </section>
  );
}
