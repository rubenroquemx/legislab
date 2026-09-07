'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] text-zinc-900">
      <Sidebar 
        mobileOpen={mobileDrawerOpen} 
        onCloseMobile={() => setMobileDrawerOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onOpenMobileMenu={() => setMobileDrawerOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-[1520px] mx-auto">
            {children}
          </div>
        </main>

        <BottomNav onOpenDrawer={() => setMobileDrawerOpen(true)} />
      </div>
    </div>
  );
}
