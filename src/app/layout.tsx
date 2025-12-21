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

export const metadata: Metadata = {
  title: 'Sales Lead Tracking Dashboard',
  description: 'Sales Lead Tracking Dashboard',
};

const CustomLogo = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#facc15', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#eab308', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
      </linearGradient>
    </defs>

    <path
      d="M45.6,7.8c-15.4,0-27.9,12.5-27.9,27.9s12.5,27.9,27.9,27.9c6.4,0,12.3-2.1,16.9-5.8l15.9,15.9c1.9,1.9,5,1.9,6.9,0s1.9-5,0-6.9L69.4,51.1c3.7-4.6,5.8-10.5,5.8-16.9C75.2,20.3,61,7.8,45.6,7.8z M45.6,57.5c-11.9,0-21.6-9.7-21.6-21.6S33.7,14.3,45.6,14.3s21.6,9.7,21.6,21.6S57.5,57.5,45.6,57.5z"
      fill="#2563eb"
    />

    <rect x="30" y="40" width="8" height="20" fill="url(#grad1)" rx="2" />
    <rect x="44" y="32" width="8" height="28" fill="url(#grad2)" rx="2" />
    <rect x="58" y="24" width="8" height="36" fill="url(#grad3)" rx="2" />

    <path
      d="M38.1,28.8c-1-1-1.2-2.5-0.4-3.7l7.5-11.3c1.2-1.8,3.9-2.1,5.5-0.7l0,0c1.7,1.4,2,3.9,0.7,5.5l-7.5,11.3C42.8,31.6,40.1,32.2,38.1,28.8z"
      fill="#f97316"
    />
    <path
      d="M37.7,25.1l-4.5-2.2c-1-0.5-1.3-1.7-0.8-2.7s1.7-1.3,2.7-0.8l4.5,2.2c1,0.5,1.3,1.7,0.8,2.7C39.8,25.3,38.6,25.6,37.7,25.1z"
      fill="#f97316"
    />
    <path
      d="M48.2,20.9l2.2-4.5c0.5-1,1.7-1.3,2.7-0.8s1.3,1.7,0.8,2.7l-2.2,4.5c-0.5,1-1.7,1.3-2.7,0.8S47.7,21.9,48.2,20.9z"
      fill="#f97316"
    />

    <path
      d="M68,30 l5,-5"
      stroke="#4ade80"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M75,18 l-5,5"
      stroke="#facc15"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M70,40 l-5,-5"
      stroke="#2563eb"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);


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
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-foreground">
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
        <Toaster />
      </body>
    </html>
  );
}
