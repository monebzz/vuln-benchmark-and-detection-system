"use client";

import { Brand } from "@/lib/companies-data-dashboard";
import { BrandCard } from "./brand-card-dashboard";

interface Props {
  items: Brand[];
}

export function BrandGrid({ items }: Props) {
  return (
    <div className="grid gap-6 p-4 rounded-lg max-w-full md:max-w-6xl mx-auto">
      {/* First row: 4 items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.slice(0, 4).map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
      {/* Second row: 5 items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {items.slice(4, 9).map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
      {/* Third row: 4 items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.slice(9, 13).map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
      {/* Fourth row: 2 items */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {items.slice(13, 15).map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
}
