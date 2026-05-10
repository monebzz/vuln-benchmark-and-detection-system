import { Vulnerability } from "@/lib/type-data-dashboard";
import { VulnerabilityCard } from "./type-card-dashboard";

interface Props {
  items: Vulnerability[];
  onView?: (id: string) => void;
}

export function VulnerabilityGrid({ items, onView }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-5xl mx-auto ">
      {items.map((item) => (
        <VulnerabilityCard key={item.id} vulnerability={item} onView={onView} />
      ))}
    </div>
  );
}
