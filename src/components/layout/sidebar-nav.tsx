
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
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '@/context/auth-context';

const links = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'LEADS UPLOAD', icon: Upload },
  { href: '/leads-update', label: 'LEADS UPDATE', icon: FilePenLine },
  { href: '/reports', label: 'REPORTS', icon: FileText },
  { href: '/profile', label: 'PROFILE', icon: User },
  { href: '/admin/users', label: 'MANAGE USERS', icon: Users, adminOnly: true },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const userRole = authContext?.user?.role;

  const isActive = (href: string) => pathname === href || (href === "/dashboard" && pathname === "/");

  return (
    <SidebarMenu>
      {isClient && links.map((link) => {
        if (link.adminOnly && userRole !== 'admin') {
            return null;
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
