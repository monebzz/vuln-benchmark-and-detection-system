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

// Elegant minimal icons matching LineVul theme
const iconColors: Record<string, string> = {
  Home: "text-[#8A8A93] group-hover:text-white transition-colors",
  BarChart: "text-[#8A8A93] group-hover:text-white transition-colors",
  PieChart: "text-[#8A8A93] group-hover:text-white transition-colors",
  Building2: "text-[#8A8A93] group-hover:text-white transition-colors",
  Package: "text-[#8A8A93] group-hover:text-white transition-colors",
  AlertTriangle: "text-[#8A8A93] group-hover:text-white transition-colors",
  LineChart: "text-[#8A8A93] group-hover:text-white transition-colors",
  Calendar: "text-[#8A8A93] group-hover:text-white transition-colors",
  Database: "text-[#8A8A93] group-hover:text-white transition-colors",
  User: "text-[#8A8A93] group-hover:text-white transition-colors",
  ShieldAlert: "text-violet-400 group-hover:text-violet-300 transition-colors",
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
        title: "LineVul AI Scanner",
        href: "/linevul",
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
    "AI Tools",
  ]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const sidebarBg = "bg-[#111113] border-r border-white/[0.07]";
  const textColor = "text-[#8A8A93]";
  const hoverBg = "hover:bg-white/[0.04] hover:text-[#E8E8EC]";
  const borderColor = "border-white/[0.06]";

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full transition-all duration-300 z-40 overflow-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent hover:scrollbar-thumb-white/10 pb-12",
        open ? "w-64 translate-x-0" : "w-64 -translate-x-full",
        sidebarBg,
      )}
    >
      {/* Header */}
      <div
        className={`relative flex h-20 items-center justify-center px-4 border-b ${borderColor}`}
      >
        {/* Close button for small screens */}
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute right-3 top-3 md:hidden rounded-lg p-2 text-[#8A8A93] hover:text-white hover:bg-white/[0.06]"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <Link href="/" className="flex flex-col items-center group">
          <div className="relative">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/[0.08]">
              <Image
                src="/logo.png"
                alt="VBS Logo"
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
          <span className="text-sm font-bold text-white tracking-wider font-mono mt-1">
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
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
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
                        "h-3.5 w-3.5 transition-transform",
                        openSections.includes(section.title) && "rotate-180",
                        textColor,
                      )}
                    />
                  </>
                ) : (
                  <Layers className={`h-4 w-4 ${textColor}`} />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-0.5 mt-1">
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
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                        open ? "ml-1" : "justify-center",
                        isActive
                          ? "bg-white/[0.08] text-white font-medium shadow-sm"
                          : "text-[#8A8A93] hover:text-[#E8E8EC] hover:bg-white/[0.04]",
                      )}
                    >
                      {/* Unified icon */}
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-white" : iconColors[item.iconName],
                        )}
                      />
                      {open && <span>{item.title}</span>}
                      {open && item.href === "/linevul" && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          AI
                        </span>
                      )}
                      {isActive && open && item.href !== "/linevul" && (
                        <ChevronRight className="h-3 w-3 ml-auto text-white/40" />
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
