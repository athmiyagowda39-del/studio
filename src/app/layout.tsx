import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { LineChart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sales Lead Tracking Dashboard',
  description: 'Sales Lead Tracking Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LineChart className="size-5" />
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
        <Toaster />
      </body>
    </html>
  );
}
