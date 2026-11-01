"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  LineChart,
  AlertTriangle,
  Shield,
  Search,
  TrendingUp,
  Users,
  Globe,
  Zap,
  CheckCircle,
  BarChart3,
  Eye,
  Sparkles,
  Lock,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import FeatureCarousel from "@/components/feature-carousel";
import { VulnerabilityGrid } from "./type-grid-layout";
import { vulnerabilities } from "@/lib/type-data-dashboard";
import { BrandGrid } from "./brand-grid-dashboard";
import { brands } from "@/lib/companies-data-dashboard";

export default function ClientHomeContent() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: "easeOut" },
  };

  const fadeInScale = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  const staggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const floatAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const features = [
    {
      icon: Database,
      title: "Comprehensive Database",
      description:
        "Access detailed information on 308,566+ CVEs with real-time updates and comprehensive analytics.",
      stats: "308K+ CVEs",
    },
    {
      icon: LineChart,
      title: "Advanced Analytics",
      description:
        "Visualize vulnerability trends, severity distributions, and exploit probabilities with interactive charts.",
      stats: "Real-time Insights",
    },
    {
      icon: AlertTriangle,
      title: "Risk Assessment",
      description:
        "Evaluate security risks with CVSS and EPSS scoring, prioritize vulnerabilities, and track patch status.",
      stats: "Smart Prioritization",
    },
  ];

  const stats = [
    {
      label: "Total Vulnerabilities",
      value: "308,566",
      icon: Shield,
      href: "/database",
    },
    {
      label: "Vendors Covered",
      value: "859",
      icon: Users,
      href: "/by-vendor?vendor=&tab=all_vendors",
    },
    {
      label: "Products Monitored",
      value: "1,799",
      icon: Globe,
      href: "/by-product?product=&tab=all_products",
    },
  ];

  // Map capabilities to stats where possible for href
  const capabilities = [
    {
      text: "Real-time vulnerability tracking",
      icon: Activity,
      href: stats.find((s) => s.label === "Daily Updates")?.href || undefined,
    },
    {
      text: "CVSS and EPSS score analysis",
      icon: BarChart3,
      href: "/dashboard?tab=analytics", // direct to analytics tab
    },
    {
      text: "Interactive data visualization",
      icon: LineChart,
      href:
        stats.find((s) => s.label === "Total Vulnerabilities")?.href ||
        "/dashboard",
    },
    {
      text: "Advanced search and filtering",
      icon: Search,
      href:
        stats.find((s) => s.label === "Products Monitored")?.href ||
        "/searchResult",
    },
    {
      text: "Export functionality for research",
      icon: Database,
      href:
        stats.find((s) => s.label === "Total Vulnerabilities")?.href ||
        "/database",
    },
    {
      text: "Trend analysis and forecasting",
      icon: TrendingUp,
      href: "/statistics",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Hero section */}
      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-20 lg:py-25">
          {/* Hero Content */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="flex flex-col items-center text-center mb-20 lg:mb-30"
          >
            {/* Main heading with modern typography */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight mt-6"
            >
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center">
                <motion.span
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Vulnerability
                </motion.span>
                <motion.span
                  className="text-zinc-400 font-medium"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Benchmark
                </motion.span>
              </div>
              <motion.span
                className="block text-white"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                System
              </motion.span>
            </motion.h1>

            {/* Search Bar */}
            <motion.div
              variants={fadeInUp}
              className="flex justify-center w-full mb-6"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const query = (
                    form.elements.namedItem("search") as HTMLInputElement
                  )?.value;
                  if (query) {
                    window.location.href = `/searchResult?q=${encodeURIComponent(
                      query,
                    )}`;
                  }
                }}
                className="w-full max-w-2xl flex items-center bg-[#0D0D0F] border border-white/[0.08] focus-within:border-white/20 rounded-xl p-1.5 transition-all shadow-sm"
              >
                <Search className="h-4 w-4 text-[#8A8A93] ml-3" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search CVEs, vendors, or weaknesses..."
                  className="flex-1 px-3 py-2 text-sm text-white bg-transparent outline-none placeholder-[#8A8A93]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-semibold rounded-lg transition-colors"
                >
                  Search
                </button>
              </form>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-sm md:text-base text-[#8A8A93] mb-8 max-w-2xl leading-relaxed"
            >
              Comprehensive analytics, intelligent deep learning inspection, and vulnerability intelligence for modern security teams.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href="/dashboard">
                <Button
                  size="default"
                  className="h-10 px-6 bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-sm font-medium rounded-xl transition-all shadow-sm"
                >
                  Explore Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/database">
                <Button
                  variant="outline"
                  size="default"
                  className="h-10 px-6 bg-[#111113] hover:bg-[#151518] border border-white/[0.08] text-white text-sm font-medium rounded-xl transition-all"
                >
                  <Eye className="mr-2 h-4 w-4 text-[#8A8A93]" />
                  View Database
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Feature Carousel Section */}
          <FeatureCarousel />

          {/* Stats Section */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInScale}>
                <Link href={stat.href}>
                  <Card
                    className="relative group rounded-xl border border-white/[0.07] hover:border-white/[0.15] bg-[#111113] hover:bg-[#151518] transition-all p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#151518] border border-white/[0.08] flex items-center justify-center text-[#8A8A93] group-hover:text-white transition-colors">
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-white tracking-tight">
                          {stat.value}
                        </div>
                        <div className="text-[#8A8A93] text-xs font-mono uppercase tracking-wider mt-0.5">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 relative z-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Vulnerabilities by Vendor
            </h2>
            <p className="text-sm text-[#8A8A93] max-w-xl mx-auto">
              Explore reported weaknesses across major technology vendors and software providers to prioritize critical exposure.
            </p>
            <main className="p-4 md:p-6">
              <BrandGrid items={brands} />
            </main>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Security Vulnerability Types
            </h2>
            <p className="text-sm text-[#8A8A93] max-w-xl mx-auto">
              Common software weaknesses, attack surfaces, and exploitation patterns categorized by CWE.
            </p>
            <main className="p-4 md:p-6">
              <VulnerabilityGrid
                items={vulnerabilities}
                onView={(_id) => {
                  // router.push(`/vulnerabilities/${id}`)
                }}
              />
            </main>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-4xl mx-auto mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Platform Capabilities
              </h2>
              <p className="text-sm text-[#8A8A93] max-w-xl mx-auto">
                Purpose-built intelligence tools for modern software security analysis and remediation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card
                    className="relative group border border-white/[0.07] bg-[#111113] hover:bg-[#151518] hover:border-white/[0.14] text-white h-full transition-all duration-300 rounded-xl p-5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#151518] border border-white/[0.08] flex items-center justify-center text-white mb-4 group-hover:border-white/20 transition-colors">
                      <feature.icon className="h-4 w-4 text-[#8A8A93] group-hover:text-white" />
                    </div>

                    <div className="inline-block px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#151518] border border-white/[0.07] mb-3">
                      {feature.stats}
                    </div>

                    <h3 className="text-base font-semibold mb-1.5 text-white">
                      {feature.title}
                    </h3>

                    <p className="text-[#8A8A93] text-xs leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Capabilities Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-20 max-w-xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Core Workflows
              </h2>
              <p className="text-sm text-[#8A8A93] max-w-md mx-auto">
                Engineered for automated tracking, deep code inspection, and actionable mitigation.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {capabilities.map((cap, idx) => {
                const Content = (
                  <motion.div
                    key={cap.text}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`group flex items-center gap-3.5 border border-white/[0.07] rounded-xl px-4 py-3 bg-[#111113] hover:bg-[#151518] hover:border-white/[0.14] transition-all duration-200 ${
                      cap.href ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#151518] border border-white/[0.08] flex items-center justify-center text-[#8A8A93] group-hover:text-white transition-colors">
                      <cap.icon className="h-4 w-4" />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {cap.text}
                    </span>
                    {cap.href && (
                      <ArrowRight className="h-4 w-4 text-[#8A8A93] ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                    )}
                  </motion.div>
                );
                return cap.href ? (
                  <Link
                    href={cap.href}
                    key={cap.text}
                    className="block focus:outline-none"
                  >
                    {Content}
                  </Link>
                ) : (
                  Content
                );
              })}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="relative text-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] p-8 md:p-12 mb-20 max-w-3xl mx-auto"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)",
              }}
            />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to analyze vulnerabilities?
              </h2>
              <p className="text-sm text-[#8A8A93] mb-6 max-w-md mx-auto leading-relaxed">
                Join engineering and security teams using VBS for deep vulnerability intelligence and automated patch generation.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button
                    size="default"
                    className="h-10 px-5 bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-sm font-semibold rounded-xl transition-all shadow-sm"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Start Analyzing
                  </Button>
                </Link>

                <Link href="/searchResult">
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 px-5 bg-[#151518] hover:bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium rounded-xl transition-all"
                  >
                    <Search className="mr-2 h-4 w-4 text-[#8A8A93]" />
                    Search CVEs
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 w-full py-12 px-4 md:px-6 border-t border-white/[0.07] bg-[#0A0A0B]"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center mb-3 group">
                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/[0.08] bg-[#111113]">
                  <Image
                    src="/logo.png"
                    alt="VBS Logo"
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="ml-2.5">
                  <span className="text-sm font-bold text-white tracking-wide font-mono">
                    VBS
                  </span>
                </div>
              </Link>
              <p className="text-[#8A8A93] mb-4 max-w-sm leading-relaxed text-xs">
                Modern vulnerability intelligence and AI-powered code inspection for cybersecurity professionals.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#111113] text-emerald-400 border border-white/[0.07] px-2.5 py-1 text-[11px] font-mono">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                  Live Feeds
                </Badge>
                <Badge className="bg-[#111113] text-[#8A8A93] border border-white/[0.07] px-2.5 py-1 text-[11px] font-mono">
                  <Lock className="h-3 w-3 mr-1.5" />
                  Secure
                </Badge>
                <Badge className="bg-[#111113] text-[#8A8A93] border border-white/[0.07] px-2.5 py-1 text-[11px] font-mono">
                  <Activity className="h-3 w-3 mr-1.5" />
                  308K+ Records
                </Badge>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white text-xs font-mono uppercase tracking-wider mb-3">
                Platform
              </h4>
              <div className="space-y-2">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/database", label: "CVE Database" },
                  { href: "/searchResult", label: "Search" },
                  { href: "/statistics", label: "Analytics" },
                  { href: "/linevul", label: "LineVul AI Scanner" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-[#8A8A93] text-xs hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.07] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[#8A8A93] text-xs">
              © 2026 Vulnerability Benchmark System. All rights reserved.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[#8A8A93] text-xs font-mono">
                System operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
