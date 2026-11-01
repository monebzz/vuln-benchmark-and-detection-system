"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const carouselSlides = [
  {
    id: 1,
    title: "Real-Time Vulnerability Detection",
    description:
      "Monitor and detect security vulnerabilities across your entire infrastructure with real-time threat intelligence and automated response systems.",
    image: "/Real-Time Vulnerability Detection.webp",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    shadowColor: "rgba(99, 102, 241, 0.4)",
  },
  {
    id: 2,
    title: "Analytics & Trend Insights",
    description:
      "Comprehensive analytics dashboard providing deep insights into security trends, vulnerability patterns, and threat evolution over time.",
    image: "/Analytics & Trend Insights.webp",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    shadowColor: "rgba(147, 51, 234, 0.4)",
  },
  {
    id: 3,
    title: "Automated Patch Management",
    description:
      "Intelligent patch management system that automatically identifies, tests, and deploys security patches with zero downtime.",
    image: "/Automated Patch Management.webp",
    gradient: "from-pink-500 via-rose-500 to-red-600",
    shadowColor: "rgba(236, 72, 153, 0.4)",
  },
  {
    id: 4,
    title: "Database Security Access",
    description:
      "Enterprise-grade database security with granular access controls, encryption, and real-time monitoring of all database operations.",
    image: "/Database Security Access.webp",
    gradient: "from-purple-500 via-violet-500 to-indigo-600",
    shadowColor: "rgba(139, 92, 246, 0.4)",
  },
  {
    id: 5,
    title: "Comprehensive Reports & Downloads",
    description:
      "Generate detailed security reports, compliance documents, and vulnerability assessments with one-click export in multiple formats.",
    image: "/Comprehensive Reports & Downloads.webp",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-600",
    shadowColor: "rgba(217, 70, 239, 0.4)",
  },
];

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 250 : -250,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 250 : -250,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = carouselSlides.length - 1;
      if (nextIndex >= carouselSlides.length) nextIndex = 0;
      return nextIndex;
    });
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, paginate]);

  const currentSlide = carouselSlides[currentIndex];

  return (
    <div
      className="relative w-full pb-12 overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background glow effect */}
      <div
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, rgba(139, 92, 246, 0.05) 0%, transparent 65%)`,
        }}
      />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10 relative z-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Enterprise Security Features
        </h2>
        <p className="text-sm text-[#8A8A93] max-w-xl mx-auto">
          Advanced capabilities designed for modern cybersecurity operations and automated mitigation.
        </p>
      </motion.div>

      {/* Main Carousel Container */}
      <div className="relative max-w-6xl mx-auto px-4 md:px-6">
        <div className="relative h-[380px] md:h-[440px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 280, damping: 28 },
                opacity: { duration: 0.25 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0"
            >
              {/* Slide Card - Full Width Image Background */}
              <div
                className="relative h-full w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing group border border-white/[0.08] bg-[#111113] shadow-xl"
              >
                {/* Full Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority
                    sizes="(max-width: 768px) 100vw, 1280px"
                  />
                </div>

                {/* Left side gradient overlay for text readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-r via-transparent to-transparent pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, #111113 0%, rgba(17, 17, 19, 0.96) 35%, rgba(17, 17, 19, 0.75) 55%, transparent 75%)",
                  }}
                />

                {/* Subtle gradient overlay on right for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* Content Container */}
                <div className="relative h-full flex items-center">
                  <div className="w-full md:w-3/5 lg:w-1/2 p-6 md:p-10 lg:p-12">
                    {/* Slide indicator */}
                    <motion.div
                      className="flex items-center gap-2.5 mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <span className="text-xl md:text-2xl font-mono font-bold text-white">
                        0{currentIndex + 1}
                      </span>
                      <div className="h-[1px] w-8 bg-white/20" />
                      <span className="text-xs font-mono text-[#8A8A93]">
                        0{carouselSlides.length}
                      </span>
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                      className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4 leading-tight tracking-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      {currentSlide.title}
                    </motion.h3>

                    {/* Description */}
                    <motion.p
                      className="text-xs md:text-sm text-[#8A8A93] leading-relaxed mb-6 max-w-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {currentSlide.description}
                    </motion.p>

                    {/* Feature pills */}
                    <motion.div
                      className="flex flex-wrap gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      {[
                        "Enterprise Ready",
                        "24/7 Monitoring",
                        "AI Powered",
                      ].map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-mono rounded-md border border-white/[0.08] text-[#8A8A93] bg-[#151518]"
                        >
                          {tag}
                        </span>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full border border-white/[0.08] bg-[#151518]/90 text-[#8A8A93] hover:text-white hover:bg-white/[0.08] transition-all group"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => paginate(1)}
          className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full border border-white/[0.08] bg-[#151518]/90 text-[#8A8A93] hover:text-white hover:bg-white/[0.08] transition-all group"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center items-center gap-2 mt-6 relative z-10">
        {carouselSlides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className="p-1"
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/20 hover:bg-white/40"
              )}
            />
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="max-w-xs mx-auto mt-4 relative z-10">
        <div
          className="h-1 rounded-full overflow-hidden bg-[#151518] border border-white/[0.06]"
        >
          <motion.div
            className="h-full bg-white/40"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            key={currentIndex}
          />
        </div>
      </div>
    </div>
  );
}
