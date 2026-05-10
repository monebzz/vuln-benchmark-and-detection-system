import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import LoaderScreen from "../loading";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <Dashboard />
    </Suspense>
  );
}
