'use client';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { FontProvider } from '@/context/FontContext';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

axios.defaults.withCredentials = true;

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (init) {
      if (!init.credentials) {
        init.credentials = 'include';
      }
    } else {
      init = { credentials: 'include' };
    }
    return originalFetch.call(this, input, init);
  };

  // Intercept localStorage.getItem to retrieve legacy keys from the unified user object
  const originalGetItem = window.localStorage.getItem;
  window.localStorage.getItem = function (key: string) {
    if (["role", "name", "email", "userId"].includes(key)) {
      const userStr = originalGetItem.call(window.localStorage, "user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (key === "userId") return user.id ? String(user.id) : null;
          return user[key] || null;
        } catch (e) {
          return null;
        }
      }
    }
    return originalGetItem.call(window.localStorage, key);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FontProvider>
        <SidebarProvider>
          {children}
          <Toaster position="top-center" containerStyle={{ zIndex: 9999999 }} />
        </SidebarProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
