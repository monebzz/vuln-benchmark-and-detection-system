import { VulnerabilityByType } from "@/components/pages/vulnerability-by-type";
import { Suspense } from "react";
import LoaderScreen from "../loading";

export default function ByTypePage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByType />
    </Suspense>
  );
}
