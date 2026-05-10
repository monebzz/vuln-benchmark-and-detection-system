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
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
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
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${currentSlide.shadowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Enterprise Security
          </span>{" "}
          Features
        </h2>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Advanced capabilities designed for modern cybersecurity operations
        </p>
      </motion.div>

      {/* Main Carousel Container */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative h-[420px] md:h-[480px] perspective-1000">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
                rotateY: { duration: 0.4 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
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
                className="relative h-full w-full rounded-2xl md:rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing group"
                style={{
                  boxShadow: `0 30px 100px -20px ${currentSlide.shadowColor}, 0 0 60px -10px ${currentSlide.shadowColor}`,
                }}
              >
                {/* Full Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    priority
                    sizes="(max-width: 768px) 100vw, 1280px"
                  />
                </div>

                {/* Left side blur overlay for text readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-r via-transparent to-transparent"
                  style={{
                    background:
                      "linear-gradient(to right, rgb(29, 41, 56) 0%, rgba(29, 41, 56, 0.95) 25%, rgba(29, 41, 56, 0.7) 45%, transparent 65%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent backdrop-blur-[1px] [mask-image:linear-gradient(to_right,black_0%,black_40%,transparent_60%)]" />

                {/* Subtle gradient overlay on right for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                {/* Top accent line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentSlide.gradient} opacity-80`}
                />

                {/* Content Container */}
                <div className="relative h-full flex items-center">
                  <div className="w-full md:w-3/5 lg:w-1/2 p-6 md:p-10 lg:p-14">
                    {/* Slide indicator */}
                    <motion.div
                      className="flex items-center gap-3 mb-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <span
                        className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${currentSlide.gradient} bg-clip-text text-transparent`}
                      >
                        0{currentIndex + 1}
                      </span>
                      <div
                        className={`h-[2px] w-12 bg-gradient-to-r ${currentSlide.gradient}`}
                      />
                      <span className="text-sm text-white/50 font-medium tracking-wider">
                        OF 0{carouselSlides.length}
                      </span>
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                      className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight tracking-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      {currentSlide.title}
                    </motion.h3>

                    {/* Description */}
                    <motion.p
                      className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed mb-6 md:mb-8 max-w-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {currentSlide.description}
                    </motion.p>

                    {/* Feature pills */}
                    <motion.div
                      className="flex flex-wrap gap-2 md:gap-3"
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
                          className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full border border-purple-400/40 text-white/90 transition-all duration-300 hover:border-purple-400/60 hover:shadow-[0_0_20px_rgba(147,51,234,0.2)]"
                          style={{ backgroundColor: "rgba(29, 41, 56, 0.9)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </motion.div>
                  </div>
                </div>

                {/* Bottom gradient fade */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent`}
                />

                {/* Corner accent */}
                <div
                  className={`absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl ${currentSlide.gradient} opacity-20 blur-3xl`}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 md:p-4 rounded-full border border-purple-500/30 text-white hover:border-purple-400/60 hover:scale-110 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_50px_-10px_rgba(147,51,234,0.4)] group"
          style={{ backgroundColor: "rgb(29, 41, 56)" }}
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => paginate(1)}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 md:p-4 rounded-full border border-purple-500/30 text-white hover:border-purple-400/60 hover:scale-110 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_50px_-10px_rgba(147,51,234,0.4)] group"
          style={{ backgroundColor: "rgb(29, 41, 56)" }}
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center items-center gap-3 mt-8 relative z-10">
        {carouselSlides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className="relative group"
          >
            {/* Outer glow ring for active */}
            {index === currentIndex && (
              <motion.div
                layoutId="activeDot"
                className={`absolute -inset-2 rounded-full bg-gradient-to-r ${slide.gradient} opacity-30 blur-md`}
              />
            )}

            {/* Dot */}
            <motion.div
              className={cn(
                "relative w-3 h-3 rounded-full transition-all duration-300",
                index === currentIndex
                  ? `bg-gradient-to-r ${slide.gradient} scale-125`
                  : "bg-white/30 hover:bg-white/50"
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mt-6 relative z-10">
        <div
          className="h-1.5 rounded-full overflow-hidden border border-purple-500/20"
          style={{ backgroundColor: "rgb(29, 41, 56)" }}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${currentSlide.gradient}`}
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
