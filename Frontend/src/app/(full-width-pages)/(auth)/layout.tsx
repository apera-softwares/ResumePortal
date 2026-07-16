"use client";

import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const illustrationRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Floating animation for the illustration
    if (illustrationRef.current) {
      gsap.to(illustrationRef.current, {
        y: -15,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }

    // Entrance animation for the right side text and elements
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, []);

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0 overflow-hidden">
          
          {/* Form Side */}
          {children}

          {/* Graphic Side */}
          <div className="relative lg:w-1/2 w-full h-full bg-gradient-to-br from-[#070926] via-[#0d0933] to-[#1d0d47] lg:flex flex-col items-center justify-center hidden overflow-hidden">
            
            {/* Glowing blur circles */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />
            
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20">
              <GridShape />
            </div>

            <div className="relative flex flex-col items-center max-w-2xl px-8 z-10 text-center">
              {/* Floating Illustration */}
              <div 
                ref={illustrationRef} 
                className="relative w-80 h-80 xl:w-96 xl:h-96 mb-6 drop-shadow-[0_0_35px_rgba(122,90,248,0.25)]"
              >
                <Image
                  src="/images/brand/login_illustration.png"
                  alt="JobStore portal illustration"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              {/* Text and branding */}
              <div ref={textRef} className="space-y-4">
                <Link href="/" className="inline-block">
                  <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-100 to-purple-200 text-3xl xl:text-4xl tracking-tight leading-tight">
                    Your Gateway to Great Jobs
                  </h1>
                </Link>
                
                <div className="flex justify-center items-center py-2">
                  <div className="relative p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner">
                    <img 
                      src="/images/brand/Login-Page_logo.png" 
                      className="h-14 w-auto object-contain px-4 py-1" 
                      alt="JobStore Logo" 
                    />
                  </div>
                </div>

                <p className="text-gray-300/80 dark:text-gray-300/70 text-base leading-relaxed max-w-lg mx-auto font-light">
                  Empowering candidates to showcase their skills and helping companies hire top talent faster. JobStore where opportunities meet ambition.
                </p>
              </div>
            </div>
          </div>

          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
