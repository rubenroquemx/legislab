'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileFullScreenMenu } from '@/components/layout/mobile-fullscreen-menu';
import { SUPERADMIN_EMAIL } from '@/lib/auth-constants';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const isSuper = Boolean(
        session.user.isSuperAdmin ||
        session.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
      );
      if (!isSuper && !session.user.officeId) {
        router.push('/planes?unassigned=true');
      }
    }
  }, [status, session, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F5F9] text-[#0B172D]">
      {/* Desktop Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F5F9]">
        {/* Desktop Navbar (hidden on mobile) */}
        <Navbar 
          onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Main Content Area - Full edge-to-edge on mobile */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-0 sm:p-6 lg:p-8 pb-0 sm:pb-6 lg:pb-8 flex flex-col">
          <div className="max-w-[1520px] mx-auto w-full flex-1 flex flex-col">
            {children}
          </div>
        </main>

        {/* Mobile Fullscreen Menu + Bottom-Right Corner Floating Toggle/Close Button */}
        <MobileFullScreenMenu
          isOpen={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </div>
  );
}