"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
    if (!theme) setTheme("dark"); // default to dark theme
  }, [theme, setTheme]);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="
        rounded-xl relative overflow-hidden
        bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500
        text-white shadow-md transition-all duration-300
        hover:scale-110 hover:shadow-[0_0_15px_rgba(139,92,246,0.6)]
        active:scale-95
        focus:outline-none focus:ring-0
        border-none outline-none ring-0
        active:outline-none active:ring-0
        !border-transparent
      "
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>

      {/* Subtle hover overlay */}
      <span
        className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400
        opacity-0 hover:opacity-20 blur-sm transition-opacity duration-500"
      ></span>
    </Button>
  );
}
