'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import LoginPage from './login/page';
import { Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useAuthContext } from '@/context/auth-context';
import SidebarNav from '@/components/layout/sidebar-nav';
import SetupPage from './setup/page';

const CustomLogo = () => <Target className="size-full" />;

export default function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, needsSetup } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (needsSetup && pathname !== '/setup') {
      router.replace('/setup');
    } else if (!needsSetup && isAuthenticated && (pathname === '/login' || pathname === '/setup')) {
      router.replace('/');
    } else if (!needsSetup && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthenticated, pathname, router, needsSetup]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (needsSetup) {
    return <SetupPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CustomLogo />
            </div>
            <span className="text-lg font-semibold">Sales Lead Tracking</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
