"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export const AuthShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphicRef = useRef<HTMLDivElement>(null);
  const badge1Ref = useRef<HTMLDivElement>(null);
  const badge2Ref = useRef<HTMLDivElement>(null);
  const badge3Ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Floating animation for the 3D isometric platform
    if (graphicRef.current) {
      gsap.to(graphicRef.current, {
        y: -14,
        rotateZ: 0.5,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Micro floating animations for surrounding glass cards
    if (badge1Ref.current) {
      gsap.to(badge1Ref.current, {
        y: -10,
        x: -4,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    if (badge2Ref.current) {
      gsap.to(badge2Ref.current, {
        y: 10,
        x: 4,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    if (badge3Ref.current) {
      gsap.to(badge3Ref.current, {
        y: -8,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Entrance fade-in for copy
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-[#09071c] via-[#0e092c] to-[#180f42] flex flex-col items-center justify-center p-6 xl:p-12 overflow-hidden select-none"
    >
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[30rem] h-[30rem] rounded-full bg-purple-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[110px] pointer-events-none" />

      {/* Geometric Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center">
        
        {/* 3D Isometric Showcase Graphic Container */}
        <div className="relative w-full max-w-lg mb-8 group flex items-center justify-center">
          
          {/* Subtle Outer Glow Frame */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-indigo-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition duration-1000" />
          
          {/* Main 3D Platform Graphic */}
          <div 
            ref={graphicRef}
            className="relative w-full aspect-square max-w-[420px] drop-shadow-[0_20px_50px_rgba(124,58,237,0.35)]"
          >
            <Image
              src="/images/brand/ai_resume_portal_3d_showcase.png"
              alt="AI Resume Portal 3D Isometric Platform"
              fill
              priority
              className="object-contain rounded-2xl"
            />
          </div>

          {/* Floating Glass Badge 1 - Top Left */}
          <div 
            ref={badge1Ref}
            className="absolute top-2 left-0 sm:-left-4 bg-gray-900/85 border border-emerald-500/30 backdrop-blur-xl rounded-xl p-3 shadow-2xl flex items-center gap-3 text-left z-20"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Match Engine</p>
              <p className="text-[11px] font-mono text-emerald-400 font-semibold">99.8% Accuracy</p>
            </div>
          </div>

          {/* Floating Glass Badge 2 - Top Right */}
          <div 
            ref={badge2Ref}
            className="absolute top-6 right-0 sm:-right-4 bg-gray-900/85 border border-blue-500/30 backdrop-blur-xl rounded-xl p-3 shadow-2xl flex items-center gap-3 text-left z-20"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Instant Export</p>
              <p className="text-[11px] text-blue-300">Publication-Ready PDF</p>
            </div>
          </div>

          {/* Floating Glass Badge 3 - Bottom Center */}
          <div 
            ref={badge3Ref}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-purple-500/30 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-left z-20 whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Visual Layout Editor</p>
              <p className="text-[10px] text-gray-400">WYSIWYG Resume Customizer</p>
            </div>
          </div>

        </div>

        {/* High-Impact Copywriting & Branding */}
        <div ref={textRef} className="space-y-3 mt-4">
          
          {/* Brand Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
              R
            </div>
            <span className="text-xs font-semibold text-gray-200 tracking-wider">RESUME PORTAL</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl xl:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200 tracking-tight leading-snug">
            Next-Gen Candidate & Resume Intelligence
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-300/85 leading-relaxed max-w-md mx-auto font-normal">
            Automate resume extraction, customize candidate layouts in real-time, and accelerate talent acquisition for modern teams.
          </p>

          {/* Feature Bullets */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-300">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Instant AI Extraction
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Visual Editor
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Clean PDF Export
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
