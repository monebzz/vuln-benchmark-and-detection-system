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
        rounded-full px-8 py-3
        bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.05)]
        shadow-md backdrop-blur-lg
        transition hover:shadow-lg hover:scale-105
        cursor-pointer

      "
    >
      {/* Icon */}
      <div className="flex items-center justify-center mr-2">
        <Image
          src={brand.image}
          alt={brand.name}
          className="object-contain"
          width={35}
          height={30}
        />
      </div>

      {/* Name */}
      <h3 className="text-md font-bold text-[hsl(var(--foreground))]">
        {brand.name}
      </h3>
    </div>
  );
}
