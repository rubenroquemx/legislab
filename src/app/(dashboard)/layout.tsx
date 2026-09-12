'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SUPERADMIN_EMAIL } from '@/lib/auth-constants';

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
    <div className="flex h-screen overflow-hidden bg-[#F3F5F9] text-[#0B172D]">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen} 
        onCloseMobile={() => setMobileDrawerOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        
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