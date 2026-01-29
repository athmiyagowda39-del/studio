
'use client';

import Header from '@/components/layout/header';
import ImpersonationBanner from '@/components/layout/impersonation-banner';
import SidebarNav from '@/components/layout/sidebar-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useApp } from '@/context/app-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';


export default function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isImpersonating, isLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !isLoading &&
      user &&
      user.forcePasswordChange &&
      !isImpersonating &&
      pathname !== '/profile'
    ) {
      router.replace('/profile');
    }
  }, [user, isLoading, isImpersonating, pathname, router]);
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <ImpersonationBanner />
        <main className="p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
