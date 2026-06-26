'use client';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
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
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        {children}
        <Toaster position="top-center" containerStyle={{ zIndex: 9999999 }} />
      </SidebarProvider>
    </ThemeProvider>
  );
}
