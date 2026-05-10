// components/VulnerabilityCard.tsx
import { Vulnerability } from "@/lib/type-data-dashboard";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  vulnerability: Vulnerability;
  onView?: (id: string) => void;
}

export function VulnerabilityCard({ vulnerability, onView }: Props) {
  const router = useRouter();
  return (
    <div
      className="
        relative group overflow-hidden rounded-2xl border
        bg-[hsl(var(--card)/0.7)]
        p-4 shadow-md transition
        backdrop-blur-xl
        hover:shadow-xl
      "
    >
      {/* Purple glow layer */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-gradient-to-br
          from-purple-600/20 via-transparent to-purple-500/10
          opacity-60 blur-2xl
          transition group-hover:opacity-90
        "
      />

      {/* Inner content wrapper (keeps content sharp) */}
      <div className="relative z-10">
        {/* Image with purple shadow */}
        <div className="relative mb-2 w-1/4 overflow-hidden rounded-xl">
          <div className="absolute inset-0 w-full h-full bg-purple-500/20 blur-md rounded-xl -z-10" />
          <Image
            src={vulnerability.image}
            alt={vulnerability.title}
            className="object-contain w-auto h-16"
            width={100}
            height={50}
          />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-[hsl(var(--foreground))] text-left">
          {vulnerability.title}
        </h3>

        {/* Description */}
        <p className="mb-4 text-sm text-zinc-300 line-clamp-2 text-left">
          {vulnerability.description}
        </p>

        {/* Action */}
        <button
          onClick={() => {
            router.push(`${vulnerability.id}`);
          }}
          className="
            flex items-end justify-end gap-2 text-sm font-medium
            text-blue-400 transition
            group-hover:gap-3
            hover:text-blue-300 text
          "
        >
          View details
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
