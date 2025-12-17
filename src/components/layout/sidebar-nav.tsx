
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

const links = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/profile', label: 'PROFILE', icon: User },
  { href: '/reports', label: 'REPORTS', icon: FileText },
];

export default function SidebarNav() {
  const pathname = usePathname();

  // For this demo, only dashboard is active.
  const isActive = (href: string) => href === '/dashboard';

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(link.href)}
            // For this demo, other links are disabled
            disabled={link.href !== '/dashboard'}
            aria-disabled={link.href !== '/dashboard'}
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
