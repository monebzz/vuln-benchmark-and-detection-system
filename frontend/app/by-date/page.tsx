import { VulnerabilityByDate } from "@/components/pages/vulnerability-by-date";
import { Suspense } from "react";
import LoaderScreen from "../loading";

export default function ByDatePage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByDate />
    </Suspense>
  );
}
