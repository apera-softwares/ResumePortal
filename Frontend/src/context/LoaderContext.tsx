"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type LoaderContextType = {
  isLoading: boolean;
  isFadingOut: boolean;
  loadingMessage: string;
  startLoading: (message: string) => void;
  stopLoading: () => void;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const pathname = usePathname();

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_LOADING_TIME = 650; // Minimum display time in ms for smooth, production-ready feel

  const startLoading = (message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    startTimeRef.current = Date.now();
    setLoadingMessage(message);
    setIsFadingOut(false);
    setIsLoading(true);
  };

  const triggerStop = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      fadeTimerRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsFadingOut(false);
      }, 250);
    }, remaining);
  };

  const stopLoading = () => {
    triggerStop();
  };

  // Reset loading state smoothly when page navigation completes (pathname changes)
  useEffect(() => {
    if (isLoading) {
      triggerStop();
    }
  }, [pathname]);

  return (
    <LoaderContext.Provider value={{ isLoading, isFadingOut, loadingMessage, startLoading, stopLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
};
