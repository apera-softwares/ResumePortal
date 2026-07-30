"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSidebar } from "../context/SidebarContext";
import { useLoader } from "../context/LoaderContext";
import { useUser } from "../context/UserContext";
import { Modal } from "../components/ui/modal";
import { ListIcon, TableIcon, TimeIcon, UserCircleIcon, GridIcon, UserIcon } from "../icons/index";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  onClick?: () => void;
};

const AdminRoute: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <TableIcon />,
    name: "Users",
    path: "/users",
  },
  {
    icon: <ListIcon />,
    name: "Candidates",
    path: "/candidates",
  },
  {
    icon: <UserCircleIcon />,
    name: "Jobs",
    path: "/jobcreation",
  },
  {
    icon: <TimeIcon />,
    name: "Skills",
    path: "/addskills",
  },
  {
    icon: <UserIcon />,
    name: "Profile",
    path: "/profile",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { name, role } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => path === pathname;
  const { startLoading } = useLoader();

  const [mounted, setMounted] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, name: string) => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
    if (pathname === path) {
      return;
    }
    const targetNames = ["candidates", "jobs", "users", "skills"];
    if (targetNames.includes(name.toLowerCase())) {
      let msg = "";
      if (name.toLowerCase() === "candidates") {
        msg = "Loading Candidates...";
      } else if (name.toLowerCase() === "jobs") {
        msg = "Loading Jobs...";
      } else if (name.toLowerCase() === "users") {
        msg = "Loading Users...";
      } else if (name.toLowerCase() === "skills") {
        msg = "Loading Skills...";
      } else {
        msg = `Loading ${name}...`;
      }
      startLoading(msg);
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed backend logout:", err);
    }
    const theme = localStorage.getItem("theme");
    const colorPalette = localStorage.getItem("colorPalette");
    const appFont = localStorage.getItem("app-font");

    localStorage.clear();
    sessionStorage.clear();

    if (theme) localStorage.setItem("theme", theme);
    if (colorPalette) localStorage.setItem("colorPalette", colorPalette);
    if (appFont) localStorage.setItem("app-font", appFont);

    toast.success("Logout successful!");
    router.replace("/login?logout=true");
  };

  const firstName = name ? name.trim().split(/\s+/)[0] : "";
  const avatarInitial = name ? name.charAt(0).toUpperCase() : "U";

  const candidateRoutes: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <ListIcon />,
      name: "Jobs",
      path: "/dashboard/jobs",
    },
    {
      icon: <UserCircleIcon />,
      name: "My Resume",
      path: "/my-resume",
    },
    {
      icon: <UserIcon />,
      name: "Profile",
      path: "/profile",
    },
  ];

  let routes: NavItem[] = [];

  switch (role) {
    case "ADMIN":
      routes = AdminRoute;
      break;
    case "HR":
      routes = AdminRoute.filter(r => r.name !== "Users");
      break;
    case "CLIENT":
      routes = AdminRoute.filter(r => r.name !== "Users" && r.name !== "Skills");
      break;
    case "CANDIDATE":
      routes = candidateRoutes;
      break;
    default:
      routes = candidateRoutes;
  }

  const isSidebarVisible = isExpanded || isHovered || isMobileOpen;

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-50 flex flex-col justify-between h-screen bg-white dark:bg-[#0E1017] border-r border-gray-200 dark:border-white/[0.08] text-gray-900 transition-all duration-300 ease-in-out px-4 py-6
          ${isSidebarVisible ? "w-[290px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Logo Section */}
          <div className={`flex items-center mb-6 px-2 ${!isSidebarVisible ? "lg:justify-center" : "justify-start"}`}>
            <Link href="/" onClick={() => isMobileOpen && toggleMobileSidebar()}>
              {isSidebarVisible ? (
                <h1 className="text-blue-900 dark:text-blue-400 text-2xl font-black tracking-tight">Resume Portal</h1>
              ) : (
                <Image src="/images/logo/logo8.png" alt="Logo" width={32} height={32} className="rounded-md" />
              )}
            </Link>
          </div>

          {/* Profile Badge */}
          <div className="mb-6 px-2 py-3 rounded-2xl bg-gray-50 dark:bg-[#131522] border border-gray-100 dark:border-white/[0.08] transition-all">
            <div className={`flex items-center gap-3 ${!isSidebarVisible ? "justify-center" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                {avatarInitial}
              </div>
              {isSidebarVisible && (
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate" title={name}>
                    {firstName || name || "User"}
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">
                    {role}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-2">
              {routes.map((nav) => (
                <li key={nav.name}>
                  {nav.onClick ? (
                    <button
                      onClick={() => {
                        if (isMobileOpen) toggleMobileSidebar();
                        nav.onClick?.();
                      }}
                      className="menu-item group menu-item-inactive w-full text-left cursor-pointer border-none bg-transparent outline-none flex items-center px-3 py-2.5 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    >
                      <span className="menu-item-icon-inactive text-gray-500 dark:text-gray-400 min-w-[24px]">
                        {nav.icon}
                      </span>
                      {isSidebarVisible && (
                        <span className="menu-item-text ml-3 font-medium text-sm text-gray-700 dark:text-gray-200">{nav.name}</span>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={nav.path}
                      onClick={(e) => handleLinkClick(e, nav.path, nav.name)}
                      className={`menu-item group flex items-center px-3 py-2.5 rounded-xl transition-all ${
                        isActive(nav.path)
                          ? "menu-item-active bg-blue-50 text-blue-700 dark:bg-brand-500/15 dark:text-brand-400 dark:border dark:border-brand-500/30 font-semibold"
                          : "menu-item-inactive text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className={`menu-item-icon min-w-[24px] ${isActive(nav.path) ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"}`}>
                        {nav.icon}
                      </span>
                      {isSidebarVisible && (
                        <span className="menu-item-text ml-3 font-medium text-sm">{nav.name}</span>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Section: Logout Button */}
        <div className="pt-4 mt-auto border-t border-gray-150 dark:border-white/[0.08]">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/40 transition-all cursor-pointer font-semibold text-sm group ${
              !isSidebarVisible ? "justify-center" : ""
            }`}
            title="Logout"
          >
            <svg
              className="w-5 h-5 min-w-[20px] text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {isSidebarVisible && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} className="max-w-[440px] m-4" showCloseButton={false}>
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-4">
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
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-750 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-xl transition-all shadow-xs border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-650 dark:hover:bg-rose-750 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AppSidebar;

