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
import { useUser } from '@/firebase';
import { useAuthContext } from '@/context/auth-context';
import SidebarNav from '@/components/layout/sidebar-nav';

const CustomLogo = () => <Target className="size-full" />;

export default function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const authContext = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = !!user;

  const usersExist = authContext ? authContext.users.length > 0 : true;

  useEffect(() => {
    if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [isAuthenticated, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // If no users exist, allow access to the user creation page
    if (!usersExist && pathname.startsWith('/admin/users')) {
       // Allow child to render, which will be the user management page
    } else if (!usersExist) {
      router.replace('/admin/users');
      return null;
    }
    else if (pathname !== '/login') {
      return <LoginPage />;
    }
  }

  if (!isAuthenticated && pathname !== '/login') {
    if (!usersExist) {
       if (pathname.startsWith('/admin/users')) {
         // This is okay, render children
       } else {
         router.replace('/admin/users');
         return null;
       }
    } else {
      return <LoginPage />;
    }
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
