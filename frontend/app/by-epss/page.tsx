import { Suspense } from "react";
import { VulnerabilityByEpss } from "@/components/pages/vulnerability-by-epss";
import LoaderScreen from "../loading";

export default function ByEpssPage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByEpss />
    </Suspense>
  );
}
