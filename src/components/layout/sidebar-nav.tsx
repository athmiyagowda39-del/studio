
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
import { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import type { AppUser } from '@/context/app-context';

type SidebarLink = {
  href: string;
  label: string;
  icon: any;
  roles?: AppUser['role'][];
};

const allLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/reports', label: 'REPORTS', icon: FileText },
  {
    href: '/users',
    label: 'MANAGE USERS',
    icon: Users,
    roles: ['Super Admin', 'Admin'],
  },
  { href: '/profile', label: 'PROFILE', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { user } = useApp();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const visibleLinks = useMemo(() => {
    if (!user) {
      return [];
    }
    return allLinks.filter(link => {
      if (!link.roles) {
        return true; // No specific roles required, show to all
      }
      return link.roles.includes(user.role); // Check if user's role is allowed
    });
  }, [user]);

  if (!isClient) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <SidebarMenu>
      {visibleLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(link.href)}
            tooltip={link.label}
          >
            <a href={link.href} className="flex items-center gap-2">
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
