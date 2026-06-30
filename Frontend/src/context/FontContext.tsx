"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

export type FontOption = {
  name: string;
  family: string;
  isGoogleFont: boolean;
};

export const AVAILABLE_FONTS: FontOption[] = [
  { name: "Inter", family: "Inter, sans-serif", isGoogleFont: true },
  { name: "Roboto", family: "Roboto, sans-serif", isGoogleFont: true },
  { name: "Poppins", family: "Poppins, sans-serif", isGoogleFont: true },
  { name: "Times New Roman", family: "'Times New Roman', Times, serif", isGoogleFont: false },
  { name: "Figtree", family: "Figtree, sans-serif", isGoogleFont: true },
  { name: "Lato", family: "Lato, sans-serif", isGoogleFont: true },
];

type FontContextType = {
  currentFont: FontOption;
  changeFont: (fontName: string) => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFont, setCurrentFont] = useState<FontOption>(AVAILABLE_FONTS[0]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedFontName = localStorage.getItem("global-font");
    const found = AVAILABLE_FONTS.find((f) => f.name === savedFontName);
    if (found) {
      setCurrentFont(found);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem("global-font", currentFont.name);

    // 1. Load Google Font if needed
    if (currentFont.isGoogleFont) {
      const linkId = "dynamic-google-font";
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${currentFont.name.replace(" ", "+")}:wght@300;400;500;600;700;800;900&display=swap`;
    }

    // 2. Apply font family globally
    document.documentElement.style.setProperty("--font-outfit", currentFont.family);
    document.body.style.fontFamily = currentFont.family;
  }, [currentFont, isInitialized]);

  const changeFont = (fontName: string) => {
    const found = AVAILABLE_FONTS.find((f) => f.name === fontName);
    if (found) {
      setCurrentFont(found);
    }
  };

  return (
    <FontContext.Provider value={{ currentFont, changeFont }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
