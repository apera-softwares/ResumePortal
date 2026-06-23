"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { ListIcon, TableIcon, TimeIcon, UserCircleIcon, GridIcon } from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
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
    icon: <TimeIcon/>,
    name: "Skills",
    path: "/addskills",
  },
];


const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = (path: string) => path === pathname;

  const [role, setRole] = useState("")
   const [name ,setName] =useState('');
  const [mounted, setMounted] = useState(false);
  
  useEffect(()=>{
    setMounted(true);
    const localStorageRole = localStorage.getItem("role")
    const localStoragename = localStorage.getItem("name")
    setRole(localStorageRole || "")
    setName(localStoragename || "")
  },[])
  
  if (!mounted) {
    return null;
  }
      
   let routes: NavItem[] = [];

  switch (role) {
    case "ADMIN":
    case "HR":
    case "CLIENT":
      routes = AdminRoute;
      break;
    default:
      routes = [];
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <h1 className="text-blue-900 text-3xl text-center font-black">Resume Portal</h1>
          ) : (
            <Image src="/images/logo/logo8.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
     
<div className=" py-10 ">
              
              <div className="flex flex-col gap-1  xl:gap-3 xl:text-left">
                    <div className="flex items-center gap-2  ">
                       {isExpanded || isHovered || isMobileOpen ? (<>   <div className="w-12 h-12  rounded-full bg-blue-800 flex items-center justify-center text-white font-bold">
                        
                         {name.charAt(0).toLocaleUpperCase()}
                      </div>
                   <div className="flex flex-col">
                                     <h4 className="text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">{name}</h4>
                    <p className="text-xs  text-gray-500 dark:text-gray-400"> 
                  {role}
                </p>
                   </div></>) : (<> <div className="w-12 h-12  rounded-full bg-blue-800 flex items-center justify-center text-white font-bold">
                        
                         {name.charAt(0).toLocaleUpperCase()}
                      </div> </>)}
                   

              </div>            
              </div>
            </div> 
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear min-h-80 ">
        
           
        <nav className=" ">
          <ul className="flex flex-col gap-4">
            { routes.map((nav) => (
              <li key={nav.name}>
                <Link
                  href={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
