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

type SidebarLink = {
  href: string;
  label: string;
  icon: any;
};

const links: SidebarLink[] = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/reports', label: 'REPORTS', icon: FileText },

  // ✅ FORCE SHOW: Manage Users (below Reports)
  { href: '/users', label: 'MANAGE USERS', icon: Users },

  { href: '/profile', label: 'PROFILE', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <SidebarMenu>
      {links.map((link) => (
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
