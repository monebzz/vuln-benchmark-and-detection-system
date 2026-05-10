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

  const bgColor = isDark
    ? "bg-[#1e1e1e] border-t border-gray-700"
    : "bg-white border-t border-gray-200";
  const activeBg = isDark
    ? " text-purple-400"
    : "text-purple-600 font-semibold";
  const inactiveText = isDark ? "text-gray-400" : "text-gray-700";

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${bgColor} md:hidden py-3`}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => {
          const isActive = item.path && pathname === item.path;
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`flex flex-1 flex-col items-center justify-center rounded-none py-3 transition-colors duration-200`}
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
                  className={`h-5 w-5 ${
                    isActive
                      ? "text-purple-500"
                      : isDark
                      ? "text-gray-400"
                      : "text-gray-700"
                  }`}
                />
                <span
                  className={`mt-1 text-xs ${
                    isActive ? activeBg : inactiveText
                  }`}
                >
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
