"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  name: string;
  email: string;
  role: string;
  updateUser: (updatedFields: Partial<User>) => void;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const loadUserFromStorage = () => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          id: parsed.id || localStorage.getItem("userId") || "",
          name: parsed.name || localStorage.getItem("name") || "",
          email: parsed.email || localStorage.getItem("email") || "",
          role: parsed.role || localStorage.getItem("role") || "",
        });
        return;
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }

    const fallbackName = localStorage.getItem("name") || "";
    const fallbackEmail = localStorage.getItem("email") || "";
    const fallbackRole = localStorage.getItem("role") || "";
    const fallbackId = localStorage.getItem("userId") || "";

    if (fallbackName || fallbackEmail || fallbackRole) {
      setUser({
        id: fallbackId,
        name: fallbackName,
        email: fallbackEmail,
        role: fallbackRole,
      });
    }
  };

  useEffect(() => {
    loadUserFromStorage();

    const handleCustomUserUpdate = (e: CustomEvent<Partial<User>>) => {
      if (e.detail) {
        setUser((prev) => {
          const current = prev || { id: "", name: "", email: "", role: "" };
          return {
            ...current,
            ...e.detail,
          };
        });
      } else {
        loadUserFromStorage();
      }
    };

    window.addEventListener("user-updated" as any, handleCustomUserUpdate);
    window.addEventListener("storage", loadUserFromStorage);

    return () => {
      window.removeEventListener("user-updated" as any, handleCustomUserUpdate);
      window.removeEventListener("storage", loadUserFromStorage);
    };
  }, []);

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      const current = prev || { id: "", name: "", email: "", role: "" };
      const updated = { ...current, ...updatedFields };

      if (typeof window !== "undefined") {
        const storedUserStr = localStorage.getItem("user");
        let userObj: any = {};
        if (storedUserStr) {
          try {
            userObj = JSON.parse(storedUserStr);
          } catch (e) { }
        }
        const newUserObj = { ...userObj, ...updated };
        localStorage.setItem("user", JSON.stringify(newUserObj));
        if (updated.name) localStorage.setItem("name", updated.name);
        if (updated.email) localStorage.setItem("email", updated.email);
        if (updated.role) localStorage.setItem("role", updated.role);

        window.dispatchEvent(
          new CustomEvent("user-updated", { detail: updatedFields })
        );
      }

      return updated;
    });
  };

  const refreshUser = () => {
    loadUserFromStorage();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "",
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
