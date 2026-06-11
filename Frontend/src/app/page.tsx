'use client'
import PublicJoblisting from "@/components/joblisting/PublicJoblisting";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useModal } from "@/hooks/useModal";

export default function GuestPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const routes = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      const isDark = savedTheme === "dark";
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to dark mode for premium feel
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogin = () => {
    routes.push('/login');
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-100 dark:border-gray-900 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
          {/* Brand Logo Container */}
          <div className="flex items-center">
            <img 
              src="/images/brand/brand-logo-png.png" 
              alt="Brand Logo" 
              className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 hover:scale-102 dark:brightness-110" 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                // Sun Icon (Switch to Light Mode)
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon Icon (Switch to Dark Mode)
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button 
              onClick={openModal} 
              className="group flex items-center gap-2 px-3.5 py-2 sm:px-4.5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg 
                className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload Resume</span>
            </button>
            
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
              <ResumeUploadForm closeModal={closeModal} />
            </Modal>
            
            <button 
              onClick={handleLogin} 
              className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>LogIn</span>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full">
        <PublicJoblisting />
      </main>
    </div>
  );
}
