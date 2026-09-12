'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SUPERADMIN_EMAIL } from '@/lib/auth-constants';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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
    <div className="flex h-screen overflow-hidden bg-black text-[#0B172D]">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen} 
        onCloseMobile={() => setMobileDrawerOpen(false)} 
      />

      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F5F9] transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] origin-left",
          mobileDrawerOpen && "lg:scale-100 scale-[0.94] rounded-[24px] overflow-hidden brightness-90 shadow-[0_20px_50px_rgba(0,0,0,0.4)] pointer-events-none"
        )}
      >
        <Navbar 
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
          <div className="max-w-[1520px] mx-auto">
            {children}
          </div>
        </main>

        <BottomNav onOpenDrawer={() => setMobileDrawerOpen(true)} />
      </div>
    </div>
  );
}