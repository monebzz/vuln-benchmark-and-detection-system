import { Suspense } from "react";
import { VulnerabilityByCvss } from "@/components/pages/vulnerability-by-cvss";
import LoaderScreen from "../loading";

export default function ByCvssPage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByCvss />
    </Suspense>
  );
}
