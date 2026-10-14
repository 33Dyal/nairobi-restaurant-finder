import Section from "@/components/ui/Section";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RecommendChat from "@/components/ai/RecommendChat";

import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({ title: "Ask for a recommendation", description: "Describe what you feel like eating and get restaurant picks in Nairobi.", path: "/recommend" });

export default function RecommendPage() {
  return (
    <Section
      id="ask"
      level={1}
      title="Ask for a recommendation"
      subtitle="Describe what you're after. We only show restaurants listed on Nairobi Eats."
      breadcrumbs={<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Ask for a recommendation" }]} />}
    >
      <RecommendChat />
    </Section>
  );
}
