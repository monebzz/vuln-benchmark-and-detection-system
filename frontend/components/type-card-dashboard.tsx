import { Vulnerability } from "@/lib/type-data-dashboard";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  vulnerability: Vulnerability;
  onView?: (id: string) => void;
}

export function VulnerabilityCard({ vulnerability }: Props) {
  const router = useRouter();
  return (
    <div
      className="
        relative group overflow-hidden rounded-xl border border-white/[0.07] hover:border-white/[0.14]
        bg-[#111113] hover:bg-[#151518]
        p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5
      "
    >
      {/* Inner content wrapper */}
      <div className="relative z-10">
        {/* Image */}
        <div className="relative mb-3 w-12 h-12 overflow-hidden rounded-lg bg-[#151518] border border-white/[0.06] p-1.5 flex items-center justify-center">
          <Image
            src={vulnerability.image}
            alt={vulnerability.title}
            className="object-contain w-auto h-8 transition-transform duration-200 group-hover:scale-105"
            width={48}
            height={48}
          />
        </div>

        {/* Title */}
        <h3 className="mb-1 text-sm font-semibold text-white text-left">
          {vulnerability.title}
        </h3>

        {/* Description */}
        <p className="mb-3 text-xs text-[#8A8A93] line-clamp-2 text-left leading-relaxed">
          {vulnerability.description}
        </p>

        {/* Action */}
        <button
          onClick={() => {
            router.push(`${vulnerability.id}`);
          }}
          className="
            flex items-center justify-end gap-1 text-xs font-mono
            text-[#8A8A93] transition-colors duration-150
            hover:text-white ml-auto
          "
        >
          <span>View details</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
