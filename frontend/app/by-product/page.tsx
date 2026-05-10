import { VulnerabilityByProduct } from "@/components/pages/vulnerability-by-product";
import { Suspense } from "react";
import LoaderScreen from "../loading";

export default function ByProductPage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByProduct />
    </Suspense>
  );
}
