"use client";

import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0 overflow-hidden">
          
          {/* Form Side */}
          {children}

          {/* Graphic Showcase Side (Pure Code & Animated UI Showcase) */}
          <div className="relative lg:w-1/2 w-full h-full lg:flex hidden overflow-hidden">
            <AuthShowcase />
          </div>

          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

