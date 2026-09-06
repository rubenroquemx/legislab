'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Strip dark class and reset storage to ensure pure clean light theme
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('tailadmin-theme');
  }, []);

  return <>{children}</>;
}
