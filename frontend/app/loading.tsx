"use client";

import Background from "@/components/background";
import { Loader2 } from "lucide-react";

export default function LoaderScreen() {
  return (
    <div className="loader-screen">
      {/* Background Layers */}
      <Background />

      {/* Loader Centered */}
      <div className="loader-content">
        <Loader2 className="loader-spinner loader-light dark:loader-dark h-10 w-10" />
        <p className="loader-text loader-text-light dark:loader-text-dark">
          Loading...
        </p>
      </div>
    </div>
  );
}
