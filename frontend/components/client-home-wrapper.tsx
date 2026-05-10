"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import the client home content
const ClientHomeContent = dynamic(
  () => import("@/components/client-home-content"),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="text-white text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    ),
  }
);

// Dynamically import the interactive background
const InteractiveBackground = dynamic(
  () => import("@/components/interactive-background"),
  { ssr: true }
);

export default function ClientHomeWrapper() {
  const router = useRouter();

  // Prefetch the dashboard page to improve navigation speed
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <InteractiveBackground />
      <ClientHomeContent />
    </div>
  );
}
