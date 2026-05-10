"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use a deterministic pseudo-random generator so SSR and client match exactly
  const rand = (index: number, salt = 0) => {
    // Mulberry32 PRNG based on a per-particle seed (index + salt)
    let t = (index + salt + 0x6D2B79F5) >>> 0;
    t += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return r;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { left, top } = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - left,
          y: e.clientY - top,
        });
      }
    };

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", updateDimensions);

    // Initial dimensions
    updateDimensions();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Generate random particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: rand(i, 1) * 100,
    y: rand(i, 2) * 100,
    size: rand(i, 3) * 4 + 1,
    speed: rand(i, 4) * 0.5 + 0.2,
  }));

  return (
    <div ref={containerRef} className="fixed inset-0 z-100 overflow-hidden">
      {/* Lighter, more vibrant gradient for both light and dark modes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 opacity-70 dark:from-blue-600 dark:via-indigo-700 dark:to-purple-700 dark:opacity-80 transition-colors duration-500" />

      {/* Optional: subtle white overlay for glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)'}} />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Interactive gradient circles that follow mouse */}
      <motion.div
        className="absolute rounded-full blur-3xl opacity-20 bg-purple-500"
        animate={{
          x: mousePosition.x - 200,
          y: mousePosition.y - 200,
          scale: [1, 1.05, 1],
        }}
        transition={{
          x: { type: "spring", stiffness: 30, damping: 25 },
          y: { type: "spring", stiffness: 30, damping: 25 },
          scale: {
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          },
        }}
        style={{ width: "400px", height: "400px" }}
      />

      <motion.div
        className="absolute rounded-full blur-3xl opacity-20 bg-blue-500"
        animate={{
          x: dimensions.width - mousePosition.x - 200,
          y: mousePosition.y - 200,
          scale: [1.05, 1, 1.05],
        }}
        transition={{
          x: { type: "spring", stiffness: 30, damping: 25 },
          y: { type: "spring", stiffness: 30, damping: 25 },
          scale: {
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 0.5,
          },
        }}
        style={{ width: "400px", height: "400px" }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.size / 8,
          }}
          animate={{
            y: [`${particle.y}%`, `${particle.y - 20}%`],
            x: [`${particle.x}%`, `${particle.x + (rand(particle.id, 5) * 10 - 5)}%`],
          }}
          transition={{
            y: {
              duration: 40 / particle.speed,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            },
            x: {
              duration: 50 / particle.speed,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
        />
      ))}
    </div>
  );
}
