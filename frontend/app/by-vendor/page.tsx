import { VulnerabilityByVendor } from "@/components/pages/vulnerability-by-vendor";
import LoaderScreen from "../loading";
import { Suspense } from "react";

export default function ByVendorPage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <VulnerabilityByVendor />
    </Suspense>
  );
}
