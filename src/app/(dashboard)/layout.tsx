'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ThemeProvider } from '@/components/theme-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-gray-800">
        {/* Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar 
          mobileOpen={mobileDrawerOpen} 
          onCloseMobile={() => setMobileDrawerOpen(false)} 
        />

        {/* Main Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar onOpenMobileMenu={() => setMobileDrawerOpen(true)} />
          
          {/* Main Content with bottom padding on mobile for BottomNav */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav onOpenDrawer={() => setMobileDrawerOpen(true)} />
        </div>
      </div>
    </ThemeProvider>
  );
}
