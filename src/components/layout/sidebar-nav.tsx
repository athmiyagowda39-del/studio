'use client';

import Link from 'next/link';
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
import { cn } from '@/lib/utils';

type SidebarLink = {
  href: string;
  label: string;
  icon: any;
  roles?: AppUser['role'][];
};

const allLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads-upload', label: 'Leads Upload', icon: Upload },
  { href: '/leads-update', label: 'Leads Update', icon: FilePenLine },
  { href: '/reports', label: 'Reports', icon: FileText },
  {
    href: '/users',
    label: 'Manage Users',
    icon: Users,
    roles: ['Super Admin', 'Admin', 'Manager'],
  },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useApp();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const visibleLinks = useMemo(() => {
    if (!user) return [];

    return allLinks.filter(link => {
      if (!link.roles) return true;
      return link.roles.includes(user.role);
    });
  }, [user]);

  if (!isClient) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex flex-col h-full">

      {/* LOGO / BRAND */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
          PW
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold">PeopleWorks</span>
          <span className="text-xs text-muted-foreground">
            Sales Dashboard
          </span>
        </div>
      </div>

      {/* MENU */}
      <SidebarMenu className="mt-3 px-2 space-y-1">
        {visibleLinks.map((link) => {
          const active = isActive(link.href);

          return (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                tooltip={link.label}
                isActive={active}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  <link.icon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  <span
                    className={cn(
                      "text-sm font-medium",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      {/* FOOTER */}
      {/* <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
        CRM System © {new Date().getFullYear()}
      </div> */}
    </div>
  );
}