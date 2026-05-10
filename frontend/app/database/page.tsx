import { Suspense } from "react";
import LoaderScreen from "../loading";
import { DatabaseView } from "@/components/pages/database-view";

export default function DatabasePage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <DatabaseView />
    </Suspense>
  );
}
