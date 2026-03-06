'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { User, LogOut } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';

export default function Header() {
  const pathname = usePathname();
  const showLoginDetails = pathname !== '/leads-upload';

  const { toast } = useToast();
  const router = useRouter();
  const { user, logout } = useApp();

  const [isClient, setIsClient] = useState(false);
  const [lastLoginDate, setLastLoginDate] = useState('N/A');
  const [currentDate, setCurrentDate] = useState(new Date());

  const loginTimeProcessed = useRef(false);

  useEffect(() => {
    setIsClient(true);

    if (!loginTimeProcessed.current) {
      const storedLastLogin = localStorage.getItem('lastLoginDate');

      if (storedLastLogin) {
        setLastLoginDate(storedLastLogin);
      }

    }

    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);

  }, []);

  const handleLogout = () => {
    logout();

    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });

    router.push('/login');
  };

  if (!isClient) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background px-4 md:px-6">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />

        {showLoginDetails && user && (
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold">
              Welcome, {user.username}
            </span>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Role: {user.role}</span>
              <span>Last Login: {lastLoginDate}</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="ml-auto flex items-center gap-6">

        {/* CLOCK */}
        <div className="hidden md:flex flex-col text-right leading-tight">
          <span className="text-sm font-semibold">
            {format(currentDate, 'p')}
          </span>

          <span className="text-xs text-muted-foreground">
            {format(currentDate, 'EEE, MMM d yyyy')}
          </span>
        </div>

        {/* USER MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">

            <DropdownMenuLabel className="flex flex-col">
              <span>{user?.username}</span>
              <span className="text-xs text-muted-foreground">
                {user?.role}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}