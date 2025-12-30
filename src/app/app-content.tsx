'use client';

import { useContext } from 'react';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { AuthContext } from '@/context/auth-context';
import LoginPage from './login/page';
import { Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CustomLogo = () => <Target className="size-full" />;

export default function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const authContext = useContext(AuthContext);
  const pathname = usePathname();

  if (!authContext || authContext.isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  const { isAuthenticated } = authContext;

  if (pathname === '/login' && !isAuthenticated) {
    return <LoginPage />;
  }

  return isAuthenticated ? (
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
  ) : (
    <LoginPage />
  );
}
