
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
  Filter,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/lead-details', label: 'LEAD DETAILS', icon: List },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/reports', label: 'REPORTS', icon: FileText },
  { href: '/profile', label: 'PROFILE', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || (href === "/dashboard" && pathname === "/");

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(link.href)}
            // For this demo, other links are disabled
            disabled={link.href !== '/dashboard' && link.href !== '/leads-upload' && link.href !== '/lead-details' && link.href !== '/leads-update' && link.href !== '/lead-filter'}
            aria-disabled={link.href !== '/dashboard' && link.href !== '/leads-upload' && link.href !== '/lead-details' && link.href !== '/leads-update' && link.href !== '/lead-filter'}
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
