
'use client';

import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

export default function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar>
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
