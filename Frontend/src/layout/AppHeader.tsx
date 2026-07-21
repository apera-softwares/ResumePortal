"use client";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { Modal } from "@/components/ui/modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

const AppHeader: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState("ADMIN");
  const [userEmail, setUserEmail] = useState("admin@resumeportal.com");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Sync token from cookies to localStorage if missing
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      };
      const cookieToken = getCookie("token");
      if (cookieToken && !localStorage.getItem("token")) {
        localStorage.setItem("token", cookieToken);
      }

      setUserName(localStorage.getItem("name") || "Admin User");
      setUserRole(localStorage.getItem("role") || "ADMIN");
      setUserEmail(localStorage.getItem("email") || "admin@resumeportal.com");
    }
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };
  const inputRef = useRef<HTMLInputElement>(null);
         
  const handleLogOut = () => {
    setIsLogoutModalOpen(true);
  };
   
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-40 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-4 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-40 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden" 
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-4">
            <ThemeToggleButton />
            
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm uppercase">
                  {userName.charAt(0)}
                </div>
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111827] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">
                        {userName}
                      </span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {userEmail}
                      </span>
                    </div>

                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push("/settings");
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogOut();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-2 cursor-pointer border-t border-gray-100 dark:border-gray-800"
                    >
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} className="max-w-[440px] m-4" showCloseButton={false}>
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-150 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Confirm Logout
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Are you sure you want to log out of your session?
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-750 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-xl transition-all shadow-xs border border-gray-200/50 dark:border-gray-700/50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setIsLogoutModalOpen(false);
                try {
                  await fetch(`${API_URL}/users/logout`, {
                    method: "POST",
                  });
                } catch (err) {
                  console.error("Failed backend logout:", err);
                }
                // Save non-sensitive UI theme preference
                const theme = localStorage.getItem("theme");
                const colorPalette = localStorage.getItem("colorPalette");
                const appFont = localStorage.getItem("app-font");

                // Clear all session and persistent storage
                localStorage.clear();
                sessionStorage.clear();

                // Restore non-sensitive UI settings
                if (theme) localStorage.setItem("theme", theme);
                if (colorPalette) localStorage.setItem("colorPalette", colorPalette);
                if (appFont) localStorage.setItem("app-font", appFont);

                toast.success("Logout successful!");
                router.replace("/login?logout=true");
              }}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-650 dark:hover:bg-rose-750 rounded-xl transition-all shadow-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default AppHeader;
