
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, User, LogOut } from 'lucide-react';
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
import { useAuth } from '@/context/auth-context';

export default function Header() {
  const pathname = usePathname();
  const showLoginDetails = pathname !== '/leads-upload';
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [lastLoginDate, setLastLoginDate] = useState('N/A');
  const { user, logout } = useAuth();
  const router = useRouter();
  const loginTimeProcessed = useRef(false);


  useEffect(() => {
    setIsClient(true);
    
    if (loginTimeProcessed.current) return;

    const storedLastLogin = localStorage.getItem('lastLoginDate');
    if (storedLastLogin) {
      setLastLoginDate(storedLastLogin);
    }
    
    const currentLoginDate = format(new Date(), 'EEEE, MMMM d, yyyy p');
    localStorage.setItem('lastLoginDate', currentLoginDate);
    
    loginTimeProcessed.current = true;

  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };


  if (!isClient) {
    return (
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex w-full items-center justify-end gap-4">
          <Button
            variant="ghost"
            className="relative h-10 w-16 rounded-full p-0"
            disabled
          >
            <Avatar className="h-10 w-10 overflow-hidden rounded-full">
              <AvatarFallback></AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center justify-between gap-4 md:gap-2 lg:gap-4">
        <div className="flex items-center gap-4">
          {showLoginDetails && user && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">
                Logged in as: {user.username.toUpperCase()}
              </span>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-muted-foreground">
                  Type: {user.role}
                </span>
                <span className="text-sm text-muted-foreground">
                  Last login: {lastLoginDate}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-16 rounded-full p-0"
              >
                <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                  <AvatarFallback>
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.username.toUpperCase()}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
