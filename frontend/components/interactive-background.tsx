"use client";

import { useEffect, useRef } from "react";

export default function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip interactive physics on reduced motion or non-hover/touch devices
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    let animationFrameId: number | null = null;
    let isRunning = false;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX1 = targetX - 192;
    let currentY1 = targetY - 192;
    let currentX2 = targetX - 192;
    let currentY2 = targetY - 192;

    const updateMotion = () => {
      // Lerp positions
      const destX1 = targetX - 192;
      const destY1 = targetY - 192;
      const destX2 = window.innerWidth - targetX - 192;
      const destY2 = targetY - 192;

      currentX1 += (destX1 - currentX1) * 0.08;
      currentY1 += (destY1 - currentY1) * 0.08;
      currentX2 += (destX2 - currentX2) * 0.06;
      currentY2 += (destY2 - currentY2) * 0.06;

      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate3d(${currentX1.toFixed(1)}px, ${currentY1.toFixed(1)}px, 0)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate3d(${currentX2.toFixed(1)}px, ${currentY2.toFixed(1)}px, 0)`;
      }

      // Check if settled to stop running RAF loop when mouse is stationary
      const delta1 = Math.abs(destX1 - currentX1) + Math.abs(destY1 - currentY1);
      const delta2 = Math.abs(destX2 - currentX2) + Math.abs(destY2 - currentY2);

      if (delta1 < 0.2 && delta2 < 0.2) {
        isRunning = false;
        animationFrameId = null;
      } else {
        animationFrameId = requestAnimationFrame(updateMotion);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(updateMotion);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    // Initial paint
    isRunning = true;
    animationFrameId = requestAnimationFrame(updateMotion);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0d1627] to-[#170e28] opacity-95" />

      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f70a_1px,transparent_1px),linear-gradient(to_bottom,#a855f70a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)]" />

      {/* Hardware-Accelerated Zero-Blur Radial Orbs (0% blur overhead, pure 60fps) */}
      <div
        ref={orb1Ref}
        className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          transform: "translate3d(0, 0, 0)",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(168, 85, 247, 0.05) 40%, transparent 70%)",
        }}
      />
      <div
        ref={orb2Ref}
        className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          transform: "translate3d(0, 0, 0)",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.20) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)",
        }}
      />

      {/* Subtle Ambient Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.12),_transparent_70%)]" />
    </div>
  );
}
