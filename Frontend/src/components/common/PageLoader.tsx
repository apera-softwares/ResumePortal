"use client";

import React from "react";

interface PageLoaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function PageLoader({
  title = "Loading...",
  subtitle = "Please wait while we fetch the latest data.",
  className = "",
}: PageLoaderProps) {
  return (
    <div
      className={`min-h-[70vh] w-full flex flex-col items-center justify-center p-6 bg-gray-50/50 dark:bg-gray-950/50 font-outfit transition-colors duration-300 ${className}`}
    >
      <div className="relative flex flex-col items-center gap-5 p-8 sm:p-10 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/80 shadow-2xl shadow-blue-500/5 max-w-md w-full text-center overflow-hidden animate-fade-in">
        {/* Subtle background glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Premium dual-ring spinner with glowing center */}
        <div className="relative w-16 h-16 flex items-center justify-center my-2">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 dark:border-blue-500/10 animate-ping opacity-30" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-indigo-500 border-l-indigo-600 animate-spin [animation-duration:1.2s] [animation-direction:reverse]" />
          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30 animate-pulse" />
        </div>

        {/* Dynamic Title and Subtitle */}
        <div className="space-y-1.5 z-10">
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Shimmering pulse bar indicator */}
        <div className="w-36 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative mt-1">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear] shadow-sm" />
        </div>
      </div>
    </div>
  );
}
