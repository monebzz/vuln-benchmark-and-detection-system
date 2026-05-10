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
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      shadowColor: "shadow-indigo-500/25",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    },
    {
      icon: LineChart,
      title: "Advanced Analytics",
      description:
        "Visualize vulnerability trends, severity distributions, and exploit probabilities with interactive charts.",
      stats: "Real-time Insights",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
      shadowColor: "shadow-purple-500/25",
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    },
    {
      icon: AlertTriangle,
      title: "Risk Assessment",
      description:
        "Evaluate security risks with CVSS and EPSS scoring, prioritize vulnerabilities, and track patch status.",
      stats: "Smart Prioritization",
      gradient: "from-pink-500 via-rose-500 to-red-600",
      shadowColor: "shadow-pink-500/25",
      iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
    },
  ];

  const stats = [
    {
      label: "Total Vulnerabilities",
      value: "308,566",
      icon: Shield,
      color: "from-blue-400 to-indigo-500",
      href: "/database",
    },
    {
      label: "Vendors Covered",
      value: "859",
      icon: Users,
      color: "from-violet-400 to-purple-500",
      href: "/by-vendor?vendor=&tab=all_vendors",
    },
    {
      label: "Products Monitored",
      value: "1,799",
      icon: Globe,
      color: "from-fuchsia-400 to-pink-500",
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
            {/* Main heading with enhanced gradient */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-tight text-white mb-8 leading-[1.0] mt-10"
            >
              <div className="flex flex-col md:flex-row gap-5 justify-center">
                <motion.span
                  className="block mb-0 md:mb-1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  Vulnerability
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(147,51,234,0.6)] mb-3 md:mb-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  Benchmark
                </motion.span>
              </div>
              <motion.span
                className="block"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                System
              </motion.span>
            </motion.h1>

            {/* Search Bar */}
            <motion.div
              variants={fadeInUp}
              className="flex justify-center w-full mb-4"
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
                className="w-full max-w-2xl flex items-center bg-white/10 backdrop-blur-md rounded-full shadow-md overflow-hidden"
              >
                <input
                  type="text"
                  name="search"
                  placeholder="Search vulnerabilities..."
                  className="flex-1 px-4 md:px-8 py-3 md:py-5 text-white bg-transparent outline-none placeholder-white/70"
                />
                <button
                  type="submit"
                  className="px-4 md:px-8 py-3 md:py-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold hover:from-purple-500 hover:to-fuchsia-500 transition-all rounded-full "
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-lg lg:text-xl text-white/90 mb-8 max-w-3xl leading-relaxed"
            >
              Comprehensive analytics and intelligent monitoring for
              cybersecurity vulnerabilities.
              <span className="block mt-4 text-white/80 text-base md:text-lg font-light">
                Make informed security decisions with real-time threat
                intelligence.
              </span>
            </motion.p>

            {/* CTA Buttons with enhanced styling */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-5"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="relative group bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 text-white px-8 py-6 text-base font-semibold transition-all duration-500 hover:scale-105 shadow-[0_10px_40px_-10px_rgba(147,51,234,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(147,51,234,0.6)] border-0 rounded-xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Explore Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </Link>

              <Link href="/database">
                <Button
                  variant="outline"
                  size="lg"
                  className="relative group bg-white/5 border-2 border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-500/10 text-white px-8 py-6 text-base font-semibold transition-all duration-500 hover:scale-100 backdrop-blur-xl rounded-xl"
                >
                  <Eye className="mr-2 h-5 w-5 group-hover:scale-105 transition-transform duration-300" />
                  View Database
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Feature Carousel Section */}
          <FeatureCarousel />

          {/* Stats Section - Enhanced */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-20 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInScale}>
                <Card
                  className="
          relative group rounded-2xl border border-purple-500/20
          shadow-md hover:shadow-xl transition-all duration-500
          overflow-hidden backdrop-blur-sm bg-[hsl(var(--card)/0.6)]
          hover:-translate-y-1
        "
                  style={{ backgroundColor: "rgb(29, 41, 56)" }}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 " />

                  <CardContent className="relative p-5 md:p-7 text-center">
                    {/* Gradient Icon without background */}
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="inline-flex p-0 rounded-xl mb-3"
                    >
                      <stat.icon
                        className="h-8 w-8 md:h-10 md:w-10"
                        style={{
                          fill: `url(#grad-${index})`,
                        }}
                      />
                      {/* SVG Gradient Definition */}
                      <svg className="hidden">
                        <defs>
                          <linearGradient
                            id={`grad-${index}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              stopColor={stat.color.split(" ")[0]}
                            />
                            <stop
                              offset="100%"
                              stopColor={stat.color.split(" ")[1]}
                            />
                          </linearGradient>
                        </defs>
                      </svg>
                    </motion.div>

                    {/* Value */}
                    <div
                      className={`text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </div>

                    {/* Label */}
                    <div className="text-white/80 text-xs md:text-sm font-medium tracking-wide">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 relative z-10"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Vulnerabilities by Vendor
              </span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Explore the security weaknesses reported across major technology
              vendors and software providers, helping you understand risk
              exposure and focus on critical updates.
            </p>
            <main className="p-8">
              <BrandGrid items={brands} />
            </main>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 relative z-10"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Security Vulnerabilities
              </span>{" "}
              Features
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Explore common security weaknesses, attack vectors, and
              exploitation risks affecting modern applications and systems.
            </p>
            <main className="p-8">
              <VulnerabilityGrid
                items={vulnerabilities}
                onView={(_id) => {
                  // router.push(`/vulnerabilities/${id}`)
                }}
              />
            </main>
          </motion.div>

          {/* Feature cards - Enhanced */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-5xl mx-auto mb-28"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Feature Highlights
                </span>
              </h2>
              <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
                Discover the key features that make our platform stand out in
                the field of cybersecurity.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
              {features.map((feature, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card
                    className={`relative group border border-purple-500/20 text-white h-full transition-all duration-500 hover:border-purple-400/40 hover:shadow-[0_25px_70px_-15px_rgba(147,51,234,0.35)] overflow-hidden rounded-2xl hover:-translate-y-2`}
                    style={{ backgroundColor: "rgb(29, 41, 56)" }}
                  >
                    {/* Animated gradient border */}
                    <div
                      className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-xl`}
                    />

                    {/* Top accent */}
                    <div />

                    <CardContent className="relative p-7 md:p-8">
                      {/* Icon container with glow */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`relative w-14 h-14 rounded-xl ${feature.iconBg} p-3.5 mb-6 shadow-xl`}
                      >
                        <feature.icon className="h-7 w-7 text-white" />
                        <div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.gradient} blur-xl opacity-40 -z-10`}
                        />
                      </motion.div>

                      {/* Stats badge */}
                      <Badge
                        className={`bg-gradient-to-r ${feature.gradient} text-white border-0 mb-4 px-3 py-1 text-xs font-semibold tracking-wide shadow-lg`}
                      >
                        {feature.stats}
                      </Badge>

                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">
                        {feature.title}
                      </h3>

                      <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {feature.description}
                      </p>

                      {/* Bottom decorative element */}
                      <div
                        className={`absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-tl ${feature.gradient} opacity-5 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-full`}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
          {/* Capabilities Section - Modern Single Column */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="mb-28"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5">
                Powerful{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Capabilities
                </span>
              </h2>
              <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto font-light">
                Everything you need to stay ahead of cybersecurity threats and
                make data-driven security decisions.
              </p>
            </div>

            <div className="flex flex-col gap-5 max-w-xl mx-auto">
              {capabilities.map((cap, idx) => {
                const Content = (
                  <motion.div
                    key={cap.text}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    whileHover={{
                      scale: cap.href ? 1.03 : 1,
                      x: cap.href ? 6 : 0,
                    }}
                    className={`group flex items-center gap-6 border border-purple-500/20 rounded-2xl px-8 py-6 bg-gradient-to-br from-blue-900/70 via-indigo-900/70 to-purple-900/70 hover:border-fuchsia-400/50 hover:shadow-[0_15px_50px_-10px_rgba(147,51,234,0.4)] transition-all duration-500 ${
                      cap.href ? "cursor-pointer" : "cursor-default"
                    }`}
                    style={{
                      backgroundColor: "rgb(29, 41, 56)",
                      boxShadow: "0 4px 15px rgba(147, 51, 234, 0.2)",
                    }}
                  >
                    <div className="flex-shrink-0 p-4 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-500/40 group-hover:from-violet-500/60 group-hover:to-purple-500/60 transition-colors duration-500">
                      <cap.icon className="h-4 w-4 text-violet-300 group-hover:text-fuchsia-300 transition-colors duration-300" />
                    </div>
                    <span className="text-white text-lg md:text-xl font-semibold group-hover:text-fuchsia-100 transition-colors duration-300">
                      {cap.text}
                    </span>
                    {cap.href && (
                      <ArrowRight className="h-6 w-6 text-fuchsia-400 ml-auto group-hover:translate-x-2 transition-transform duration-300" />
                    )}
                  </motion.div>
                );
                return cap.href ? (
                  <Link
                    href={cap.href}
                    key={cap.text}
                    className="block focus:outline-none focus:ring-2 focus:ring-fuchsia-400 rounded-2xl"
                  >
                    {Content}
                  </Link>
                ) : (
                  Content
                );
              })}
            </div>
          </motion.div>

          {/* CTA Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative text-center overflow-hidden rounded-2xl md:rounded-3xl border border-purple-500/30"
            style={{ backgroundColor: "rgb(29, 41, 56)" }}
          >
            {/* Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-fuchsia-900/30" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.25),transparent_60%)]" />

            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/25 rounded-full blur-[80px]" />

            <div className="relative p-10 md:p-14 lg:p-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-5">
                Ready to enhance your{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  security posture
                </span>
                ?
              </h2>
              <p className="text-base md:text-lg text-white/90 mb-8 max-w-xl mx-auto font-light">
                Join security professionals who trust VBS for comprehensive
                vulnerability intelligence and risk assessment.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="relative group bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-8 py-6 text-base font-semibold transition-all duration-500 hover:scale-105 shadow-[0_10px_40px_-10px_rgba(147,51,234,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(147,51,234,0.6)] border-0 rounded-xl overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Start Analyzing
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </Button>
                </Link>

                <Link href="/searchResult">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group bg-white/5 border-2 border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-500/10 text-white px-8 py-6 text-base font-semibold transition-all duration-500 hover:scale-105 backdrop-blur-xl rounded-xl"
                  >
                    <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Search CVEs
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer - Enhanced */}
      <footer
        className="relative z-10 w-full py-14 md:py-16 px-4 md:px-6 border-t border-purple-500/20"
        style={{ backgroundColor: "rgb(29, 41, 56)" }}
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-purple-900/10 pointer-events-none" />
        <div className="container mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 mb-10">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center mb-5 group">
                <div className="relative">
                  <div className="absolute inset-0  rounded-full scale-125" />
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="VBS Logo"
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-white tracking-wide group-hover:text-purple-300 transition-colors">
                    VBS
                  </span>
                  <span className="block text-[10px] text-purple-300/80 uppercase tracking-widest">
                    Vulnerability Benchmark System
                  </span>
                </div>
              </Link>
              <p className="text-white/50 mb-5 max-w-sm leading-relaxed text-sm">
                Professional vulnerability intelligence platform for modern
                cybersecurity teams. Stay informed, stay secure.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-emerald-500/15 to-green-500/15 text-emerald-400 border border-emerald-500/25 px-3 py-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                  Live
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500/15 to-violet-500/15 text-purple-300 border border-purple-400/25 px-3 py-1.5 text-xs">
                  <Lock className="h-3 w-3 mr-1.5" />
                  Secure
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-300 border border-blue-400/25 px-3 py-1.5 text-xs">
                  <Activity className="h-3 w-3 mr-1.5" />
                  Real-time
                </Badge>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-4 flex items-center">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full mr-2" />
                Platform
              </h4>
              <div className="space-y-2.5">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/database", label: "CVE Database" },
                  { href: "/searchResult", label: "Search" },
                  { href: "/statistics", label: "Analytics" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-white/50 text-sm hover:text-purple-300 transition-colors duration-300 hover:translate-x-1 transform"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <p className="text-white/40 text-xs">
                © 2026 Vulnerability Benchmark System. Professional
                vulnerability intelligence platform.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-white/40 text-xs">
                  Built for security professionals
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-emerald-400 text-xs font-medium">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
