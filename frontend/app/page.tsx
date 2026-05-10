"use client";
import {
  ArrowRight,
  Menu,
  Terminal,
  Shield,
  Lock,
  Zap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ClientHomeWrapper from "@/components/client-home-wrapper";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cybersecurity-themed header */}
      <header
        className="z-50 w-full py-3 px-0 md:px-6 lg:px-8 backdrop-blur-xl border-b border-purple-500/25 shadow-[0_4px_30px_rgba(147,51,234,0.15)] fixed top-0"
        style={{ backgroundColor: "rgba(29, 41, 56, 0.95)" }}
      >
        {/* Animated top border accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70" />

        <div className="container mx-auto flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex flex-col items-center group">
            <div className="relative">
              <div className="absolute inset-0 rounded-full scale-125" />
              <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="VBS Logo"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </div>
            <span className="text-md font-bold text-white tracking-wider font-mono">
              VBS
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { href: "/dashboard", label: "Dashboard", icon: Terminal },
              { href: "/database", label: "Database", icon: Shield },
              { href: "/statistics", label: "Analytics", icon: Zap },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative group px-4 py-2 rounded-lg transition-all duration-300"
              >
                {/* Hover background */}
                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 rounded-lg transition-all duration-300" />
                {/* Bottom glow on hover */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-purple-400 group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(147,51,234,0.8)]" />
                <span className="relative flex items-center gap-2 text-white/80 group-hover:text-white transition-colors font-medium text-sm">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="hidden md:flex">
              <Button className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border border-purple-400/30 font-semibold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 rounded-lg">
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-purple-400 hover:bg-purple-500/10 border border-purple-500/30"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Mobile Menu Drawer */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" />
                {/* Drawer */}
                <div
                  ref={menuRef}
                  className="fixed z-50 top-0 right-0 w-64 h-auto bg-gray-900 shadow-xl flex flex-col p-6 animate-slide-in rounded-lg"
                >
                  <button
                    className="self-end mb-2 text-white/70 hover:text-white text-2xl"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    &times;
                  </button>
                  <nav className="flex flex-col gap-4 mt-2 bg-gray-900 rounded-lg p-4">
                    <Link
                      href="/dashboard"
                      className="text-white/90 hover:text-white font-medium text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Terminal className="inline-block mr-2 h-5 w-5 text-blue-500" />
                      Dashboard
                    </Link>
                    <Link
                      href="/database"
                      className="text-white/90 hover:text-white font-medium text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Shield className="inline-block mr-2 h-5 w-5 text-purple-500" />
                      Database
                    </Link>
                    <Link
                      href="/statistics"
                      className="text-white/90 hover:text-white font-medium text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Zap className="inline-block mr-2 h-5 w-5 text-red-500" />
                      Analytics
                    </Link>
                  </nav>
                </div>
                <style jsx global>{`
                  @keyframes slide-in {
                    from {
                      transform: translateX(100%);
                    }
                    to {
                      transform: translateX(0);
                    }
                  }
                  .animate-slide-in {
                    animation: slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                `}</style>
              </>
            )}
          </div>
        </div>
      </header>
      <ClientHomeWrapper />
    </div>
  );
}
