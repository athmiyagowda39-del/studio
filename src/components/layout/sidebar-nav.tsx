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
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/app-context';

const links = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/profile', label: 'PROFILE', icon: User },
  { href: '/reports', label: 'REPORTS', icon: FileText },
  { href: '/users', label: 'MANAGE USERS', icon: Users, adminOnly: true },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { originalUser } = useApp();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isActive = (href: string) =>
    pathname.startsWith(href) && (href !== '/' || pathname === '/');

  const isAdmin =
    originalUser?.role === 'Admin' ||
    originalUser?.role === 'Sub Admin' ||
    originalUser?.role === 'Super Admin';

  const allLinks = links.filter((link) => !(link as any).adminOnly || isAdmin);

  return (
    <SidebarMenu>
      {isClient &&
        allLinks.map((link) => {
          if (link.href === '/dashboard' && pathname === '/') {
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={true} tooltip={link.label}>
                  <a href="/" className="flex items-center gap-2">
                    <link.icon />
                    <span>{link.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(link.href)}
                tooltip={link.label}
              >
                <a href={link.href} className="flex items-center gap-2">
                  <link.icon />
                  <span>{link.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
    </SidebarMenu>
  );
}
