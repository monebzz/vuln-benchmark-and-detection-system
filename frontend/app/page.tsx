"use client";
import {
  ArrowRight,
  Menu,
  Terminal,
  Shield,
  Lock,
  Zap,
  Search,
  ShieldAlert,
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
    <div className="min-h-screen flex flex-col bg-[#0A0A0B]">
      {/* Cybersecurity-themed header */}
      <header
        className="z-50 w-full py-3 px-4 md:px-6 lg:px-8 backdrop-blur-md border-b border-white/[0.07] bg-[#0A0A0B]/85 fixed top-0"
      >
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/[0.08] bg-[#111113]">
              <Image
                src="/logo.png"
                alt="VBS Logo"
                width={32}
                height={32}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="text-sm font-semibold text-white tracking-wider font-mono">
              VBS
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { href: "/dashboard", label: "Dashboard", icon: Terminal },
              { href: "/database", label: "Database", icon: Shield },
              { href: "/statistics", label: "Analytics", icon: Zap },
              { href: "/linevul", label: "AI Scanner", icon: ShieldAlert },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#8A8A93] hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <item.icon className="h-3.5 w-3.5 text-[#8A8A93]" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="hidden md:flex">
              <Button className="h-8 px-3.5 text-xs font-medium rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] transition-all">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-[#8A8A93] hover:text-white hover:bg-white/[0.06] border border-white/[0.08] rounded-lg"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            {/* Mobile Menu Drawer */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" 
                  onClick={() => setMenuOpen(false)}
                />
                {/* Drawer */}
                <div
                  ref={menuRef}
                  className="fixed z-50 top-0 right-0 w-64 h-full bg-[#111113] border-l border-white/[0.08] shadow-2xl flex flex-col p-6 animate-slide-in"
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.07]">
                    <span className="text-sm font-semibold text-white font-mono">Navigation</span>
                    <button
                      className="text-[#8A8A93] hover:text-white text-lg p-1"
                      onClick={() => setMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      &times;
                    </button>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8A8A93] hover:text-white hover:bg-white/[0.05] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Terminal className="h-4 w-4 text-[#8A8A93]" />
                      Dashboard
                    </Link>
                    <Link
                      href="/database"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8A8A93] hover:text-white hover:bg-white/[0.05] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4 text-[#8A8A93]" />
                      Database
                    </Link>
                    <Link
                      href="/statistics"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8A8A93] hover:text-white hover:bg-white/[0.05] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Zap className="h-4 w-4 text-[#8A8A93]" />
                      Analytics
                    </Link>
                    <Link
                      href="/linevul"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8A8A93] hover:text-white hover:bg-white/[0.05] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ShieldAlert className="h-4 w-4 text-violet-400" />
                      AI Scanner
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
