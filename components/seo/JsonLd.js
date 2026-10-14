// Renders structured data for search engines. "<" is escaped so that text typed by
// owners (descriptions, names) can never close the script tag early.
export default function JsonLd({ data }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
