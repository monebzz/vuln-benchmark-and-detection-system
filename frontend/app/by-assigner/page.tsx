import { VulnerabilityByAssigner } from "@/components/pages/vulnerability-by-assigner";
import { Suspense } from "react";
import LoaderScreen from "../loading";

export default function ByAssignerPage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByAssigner />
    </Suspense>
  );
}
