"use client";
import React from "react";

interface PageLoaderProps {
  message: string;
  isFadingOut?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message, isFadingOut = false }) => {
  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-gray-900/30 dark:bg-gray-950/50 backdrop-blur-md transition-all duration-300 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
      }`}
    >
      <div className="flex flex-col items-center space-y-6 p-8 rounded-3xl bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-gray-100 dark:border-gray-800/80 max-w-xs w-full mx-4 transform transition-transform duration-300">
        
        {/* Premium Spinner */}
        <div className="relative w-16 h-16">
          {/* Pulsing Backlight Effect */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-400/20 blur-xl animate-pulse"></div>
          
          {/* Outer track */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
          
          {/* Rotating gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
          
          {/* Inner ring track */}
          <div className="absolute inset-2 rounded-full border border-blue-500/10 dark:border-blue-400/10"></div>
          
          {/* Inner pulsing blue dot */}
          <div className="absolute inset-4 rounded-full bg-blue-600/10 dark:bg-blue-400/15 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></div>
          </div>
        </div>

        {/* Loading Message & Status */}
        <div className="flex flex-col items-center space-y-3">
          <p className="text-gray-800 dark:text-gray-200 font-semibold text-base tracking-wide text-center">
            {message}
          </p>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400/80 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-400/60 animate-bounce"></span>
          </div>
        </div>

      </div>
    </div>
  );
};
