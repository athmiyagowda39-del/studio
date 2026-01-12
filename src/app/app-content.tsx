'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import { Target } from 'lucide-react';
import SidebarNav from '@/components/layout/sidebar-nav';
import { useAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';

const CustomLogo = () => <Target className="size-full" />;

export default function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CustomLogo />
              </div>
              <span className="text-lg font-semibold">
                Sales Lead Tracking
              </span>
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
      </div>
    </SidebarProvider>
  );
}
