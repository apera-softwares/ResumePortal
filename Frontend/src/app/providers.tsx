'use client';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { FontProvider } from '@/context/FontContext';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import SmoothScroll from '@/components/SmoothScroll';
import { LoaderProvider, useLoader } from '@/context/LoaderContext';
import { PageLoader } from '@/components/ui/PageLoader';

axios.defaults.withCredentials = true;

if (typeof window !== "undefined") {
  // Axios Request Interceptor
  axios.interceptors.request.use(
    (config) => {
      const token = window.localStorage.getItem("token");
      if (token && config.headers && !config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    init = init || {};
    if (!init.credentials) {
      init.credentials = 'include';
    }

    const token = window.localStorage.getItem("token");
    if (token) {
      if (!init.headers) {
        init.headers = {};
      }

      if (init.headers instanceof Headers) {
        if (!init.headers.has("Authorization")) {
          init.headers.set("Authorization", `Bearer ${token}`);
        }
      } else if (Array.isArray(init.headers)) {
        const hasAuth = init.headers.some(([key]) => key.toLowerCase() === 'authorization');
        if (!hasAuth) {
          init.headers.push(["Authorization", `Bearer ${token}`]);
        }
      } else {
        const hasAuth = Object.keys(init.headers).some(k => k.toLowerCase() === 'authorization');
        if (!hasAuth) {
          (init.headers as any)["Authorization"] = `Bearer ${token}`;
        }
      }
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

function PageLoaderWrapper() {
  const { isLoading, isFadingOut, loadingMessage } = useLoader();
  if (!isLoading) return null;
  return <PageLoader message={loadingMessage} isFadingOut={isFadingOut} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FontProvider>
        <UserProvider>
          <SidebarProvider>
            <LoaderProvider>
              <SmoothScroll />
              {children}
              <PageLoaderWrapper />
              <Toaster position="top-center" containerStyle={{ zIndex: 9999999 }} />
            </LoaderProvider>
          </SidebarProvider>
        </UserProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
