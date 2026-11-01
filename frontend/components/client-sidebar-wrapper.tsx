"use client";

import { useState, useEffect } from "react";
import type React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import LoaderScreen from "@/app/loading";

export function ClientSidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check screen size on mount and resize
  useEffect(() => {
    if (!isMounted) return;

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);

      // Close sidebar by default only on mobile (< 768px)
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Initial check
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [isMounted]);

  // Don't show sidebar on home page
  if (pathname === "/") {
    return <>{children}</>;
  }

  // Show loading state until client-side code is ready
  if (!isMounted) {
    return <LoaderScreen />;
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full relative">
        <DashboardSidebar />
        <main
          className={`flex-1 min-h-screen overflow-x-hidden pb-16 md:pb-0 transition-all duration-200 ${
            sidebarOpen && !isMobile ? "ml-64" : "ml-0"
          }`}
        >
          {children}
        </main>
        {/* Screen overlay to close sidebar on click for mobile only */}
        {sidebarOpen && isMobile && (
          <div
            aria-hidden
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {(isMobile || isTablet) && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
