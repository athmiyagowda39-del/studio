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
import SignUpPage from './signup/page';

const CustomLogo = () => <Target className="size-full" />;

export default function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = !!user;

  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  useEffect(() => {
    if (!isUserLoading) {
      if (isAuthenticated && isAuthRoute) {
        router.replace('/');
      } else if (!isAuthenticated && !isAuthRoute) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isUserLoading, pathname, router, isAuthRoute]);

  if (isUserLoading || (!isAuthenticated && !isAuthRoute)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated && isAuthRoute) {
    if (pathname === '/signup') {
      return <SignUpPage />;
    }
    return <LoginPage />;
  }
  
  if (isAuthenticated && !isAuthRoute) {
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

  // Fallback for edge cases, renders a loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}
