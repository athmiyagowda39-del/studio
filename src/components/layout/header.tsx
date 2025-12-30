'use client';

import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { ImagePlaceholder } from '@/lib/placeholder-images.d';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Bell, User, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useContext } from 'react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthContext } from '@/context/auth-context';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const [userAvatar, setUserAvatar] = useState<ImagePlaceholder | undefined>();
  const [currentDate, setCurrentDate] = useState('');
  const pathname = usePathname();
  const showLoginDetails = pathname !== '/leads-upload';
  const authContext = useContext(AuthContext);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setUserAvatar(PlaceHolderImages.find((img) => img.id === 'user-avatar'));
    setCurrentDate(format(new Date(), 'dd-MM-yyyy'));
  }, []);

  const handleLogout = () => {
    if (authContext) {
      authContext.logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    }
  };

  const user = authContext?.user;
  const lastLoginDate = 'sub admin'; // Mocked as there's no stored last login

  if (!isClient) {
    return (
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex w-full items-center justify-end gap-4">
          <div className="h-10 w-16 rounded-full p-0">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <AvatarFallback></AvatarFallback>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center justify-between gap-4 md:gap-2 lg:gap-4">
        <div className="flex items-center gap-2">
          {showLoginDetails && user && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">
                Logged in as: {user.username.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                Last Login: {lastLoginDate}
              </span>
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
                  {userAvatar && (
                    <Image
                      src={userAvatar.imageUrl}
                      alt={userAvatar.description}
                      width={64}
                      height={40}
                      data-ai-hint={userAvatar.imageHint}
                      className="object-cover"
                    />
                  )}
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
