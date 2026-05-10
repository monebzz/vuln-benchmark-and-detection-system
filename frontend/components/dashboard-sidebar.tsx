"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  ShieldAlert,
  PieChart,
  LineChart,
  Database,
  Building2,
  Package,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Layers,
  ChevronDown,
  User,
  X,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useTheme } from "next-themes";

// Always-colored icons
const iconColors: Record<string, string> = {
  Home: "text-blue-400",
  BarChart: "text-purple-400",
  PieChart: "text-pink-400",
  Building2: "text-green-400",
  Package: "text-yellow-400",
  AlertTriangle: "text-red-400",
  LineChart: "text-cyan-400",
  Calendar: "text-orange-400",
  Database: "text-indigo-400",
  User: "text-purple-400",
  ShieldAlert: "text-red-500",
};

// Navigation items with "Assigner" added
const navigationItems = [
  {
    title: "Dashboard",
    items: [
      { title: "Overview", href: "/dashboard", icon: Home, iconName: "Home" },
      {
        title: "Stats",
        href: "/statistics",
        icon: LineChart,
        iconName: "BarChart",
      },
    ],
  },
  {
    title: "Vulnerabilities",
    items: [
      {
        title: "Types",
        href: "/by-type",
        icon: PieChart,
        iconName: "PieChart",
      },
      {
        title: "Vendors",
        href: "/by-vendor",
        icon: Building2,
        iconName: "Building2",
      },
      {
        title: "Products",
        href: "/by-product",
        icon: Package,
        iconName: "Package",
      },
      { title: "Assigner", href: "/by-assigner", icon: User, iconName: "User" },
      {
        title: "CVSS",
        href: "/by-cvss",
        icon: AlertTriangle,
        iconName: "AlertTriangle",
      },
      {
        title: "EPSS",
        href: "/by-epss",
        icon: LineChart,
        iconName: "LineChart",
      },
      {
        title: "Dates",
        href: "/by-date",
        icon: Calendar,
        iconName: "Calendar",
      },
    ],
  },
  {
    title: "Database",
    items: [
      {
        title: "CVE DB",
        href: "/database",
        icon: Database,
        iconName: "Database",
      },
    ],
  },
  {
    title: "AI Tools",
    items: [
      {
        title: "Vuln Detection System",
        href: "/scanner",
        icon: ShieldAlert,
        iconName: "ShieldAlert",
      },
    ],
  },
  // {
  //   title: "Download",
  //   items: [
  //     {
  //       title: "Download Cve Data",
  //       href: "/download",
  //       icon: Download,
  //       iconName: "Download",
  //     },
  //   ],
  // },
];

export function DashboardSidebar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const [openSections, setOpenSections] = useState<string[]>([
    "Dashboard",
    "Vulnerabilities",
  ]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const sidebarBg = isDark
    ? "bg-[rgb(28,40,55)] border-r border-white/10"
    : "bg-[rgb(243,244,246)] border-r border-gray-300";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-black/5";
  const borderColor = isDark ? "border-white/10" : "border-gray-300";

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full transition-all duration-300 z-40 overflow-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent hover:scrollbar-thumb-purple-300 hover:dark:scrollbar-thumb-purple-700 pb-12",
        open ? "w-64 translate-x-0" : "w-64 -translate-x-full",
        sidebarBg,
      )}
      style={{
        boxShadow: "4px 0 24px rgba(0, 0, 0, 0.25)",
        borderRadius: "0 12px 12px 0",
      }}
    >
      {/* Header */}
      <div
        className={`relative flex h-24 items-center justify-center px-4 border-b ${borderColor}`}
      >
        {/* Close button for small screens */}
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute right-3 top-3 md:hidden rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        </button>
        <Link href="/" className="flex flex-col items-center group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full scale-125" />
            <div className="relative w-10 h-10 rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="VBS Logo"
                width={40}
                height={40}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
          <span className="text-base font-bold text-black dark:text-white tracking-wider font-mono">
            VBS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {navigationItems.map((section) => (
            <Collapsible
              key={section.title}
              open={openSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  textColor,
                  hoverBg,
                  open ? "justify-between" : "justify-center",
                )}
              >
                {open ? (
                  <>
                    <span>{section.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.includes(section.title) && "rotate-180",
                        textColor,
                      )}
                    />
                  </>
                ) : (
                  <Layers className={`h-4 w-4 ${textColor}`} />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        hoverBg,
                        open ? "ml-2" : "justify-center",
                        isActive ? "font-semibold" : "font-normal",
                        textColor,
                      )}
                    >
                      {/* Always-colored icon */}
                      <item.icon
                        className={cn("h-4 w-4", iconColors[item.iconName])}
                      />
                      {open && <span>{item.title}</span>}
                      {isActive && open && (
                        <ChevronRight className={`h-3 w-3 ${textColor}`} />
                      )}
                    </Link>
                  );
                })}
              </CollapsibleContent>

              {section !== navigationItems[navigationItems.length - 1] && (
                <Separator className={`my-2 ${borderColor}`} />
              )}
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
