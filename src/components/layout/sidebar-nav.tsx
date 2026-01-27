
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

type SidebarLink = {
  href: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
};

const links: SidebarLink[] = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/reports', label: 'REPORTS', icon: FileText },

  // ✅ Manage Users (below Reports)
  { href: '/users', label: 'MANAGE USERS', icon: Users, adminOnly: true },

  { href: '/profile', label: 'PROFILE', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { originalUser } = useApp();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Prevent rendering before client + user load
  if (!isClient) return null;

  // ✅ Active link check
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // ✅ Normalize role safely
  const role = (originalUser?.role || '').toLowerCase();

  const isAdmin =
    role === 'admin' ||
    role === 'sub admin' ||
    role === 'super admin';

  // ✅ Filter links based on role
  const visibleLinks = links.filter(
    (link) => !link.adminOnly || isAdmin
  );

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
