"use client";
import { Brand } from "@/lib/companies-data-dashboard";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  brand: Brand;
}

export function BrandCard({ brand }: Props) {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        router.push(`${brand.id}`);
      }}
      className="
        group relative flex items-center justify-center
        rounded-xl px-5 py-2.5
        bg-[#111113] hover:bg-[#151518]
        border border-white/[0.07] hover:border-white/[0.14]
        shadow-sm
        transition-all duration-200 hover:-translate-y-0.5
        cursor-pointer select-none
      "
    >
      {/* Icon */}
      <div className="flex items-center justify-center mr-2.5 shrink-0">
        <Image
          src={brand.image}
          alt={brand.name}
          className="object-contain"
          width={24}
          height={24}
        />
      </div>

      {/* Name */}
      <h3 className="text-xs font-semibold text-white tracking-wide">
        {brand.name}
      </h3>
    </div>
  );
}
