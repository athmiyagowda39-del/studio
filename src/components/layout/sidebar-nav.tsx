
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
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/reports', label: 'REPORTS', icon: FileText },
  { href: '/profile', label: 'PROFILE', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isActive = (href: string) => pathname === href || (href === "/dashboard" && pathname === "/");

  return (
    <SidebarMenu>
      {isClient && links.map((link) => (
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
      ))}
    </SidebarMenu>
  );
}
