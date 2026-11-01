"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart2, Database, Menu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: BarChart2, label: "Stats", path: "/statistics" },
    { icon: Database, label: "Database", path: "/database" },
    { icon: Menu, label: "Menu", action: toggleSidebar },
  ];

  const bgColor = "bg-[#111113] border-t border-white/[0.07]";
  const activeBg = "text-white font-semibold";
  const inactiveText = "text-[#8A8A93]";

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${bgColor} md:hidden py-2 backdrop-blur-md`}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => {
          const isActive = item.path && pathname === item.path;
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`flex flex-1 flex-col items-center justify-center rounded-lg py-2.5 transition-colors duration-150 ${
                isActive ? "text-white" : "text-[#8A8A93]"
              }`}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  router.push(item.path);
                }
              }}
            >
              <div className="flex justify-center items-center flex-col">
                <item.icon
                  className={`h-4 w-4 ${
                    isActive ? "text-white" : "text-[#8A8A93]"
                  }`}
                />
                <span className={`mt-1 text-[11px] ${isActive ? activeBg : inactiveText}`}>
                  {item.label}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
