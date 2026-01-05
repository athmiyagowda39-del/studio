'use client';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Upload,
  FilePenLine,
  User,
  FileText,
  List,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/auth-context';

const links = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/lead-details', label: 'LEAD DETAILS', icon: List },
  { href: '/reports', label: 'REPORTS', icon: FileText },
  { href: '/profile', label: 'PROFILE', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const authContext = useAuthContext();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const userRole = authContext?.user?.role;

  const isActive = (href: string) => pathname.startsWith(href) && (href !== '/' || pathname === '/');

  return (
    <SidebarMenu>
      {isClient && links.map((link) => {
        // Special handling for dashboard/home
        if (link.href === '/dashboard' && pathname === '/') {
             return (
                <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                    asChild
                    isActive={true}
                    tooltip={link.label}
                >
                    <a href="/">
                    <link.icon />
                    <span>{link.label}</span>
                    </a>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )
        }

        return (
            <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
                asChild
                isActive={isActive(link.href)}
                tooltip={link.label}
            >
                <a href={link.href}>
                <link.icon />
                <span>{link.label}</span>
                </a>
            </SidebarMenuButton>
            </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  );
}
