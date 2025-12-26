
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

  useEffect(() => {
    setUserAvatar(PlaceHolderImages.find((img) => img.id === 'user-avatar'));
    setCurrentDate(format(new Date(), 'dd-MM-yyyy'));
  }, []);
  
  const handleLogout = () => {
    authContext?.logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center justify-between gap-4 md:gap-2 lg:gap-4">
        <div className="flex items-center gap-2">
          {showLoginDetails && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">Logged in as: ATHMIYA</span>
              <span className="text-xs text-muted-foreground">
                Type: SUB ADMIN | Last Login: {currentDate}
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
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-10 w-10">
                  {userAvatar && (
                    <Image
                      src={userAvatar.imageUrl}
                      alt={userAvatar.description}
                      width={36}
                      height={36}
                      data-ai-hint={userAvatar.imageHint}
                      className="rounded-full"
                    />
                  )}
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>ATHMIYA</DropdownMenuLabel>
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
