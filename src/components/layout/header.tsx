'use client';

import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Bell } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');
  const pathname = usePathname();
  const showLoginDetails = pathname !== '/leads-upload';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center justify-between gap-4 md:gap-2 lg:gap-4">
        <div className="flex items-center gap-2">
           {showLoginDetails && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">Logged in as: ATHMIYA</span>
              <span className="text-xs text-muted-foreground">
                Type: SUB ADMIN | Last Login: 15-11-2025
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                {userAvatar && (
                  <Image
                    src={userAvatar.imageUrl}
                    alt={userAvatar.description}
                    width={40}
                    height={40}
                    data-ai-hint={userAvatar.imageHint}
                  />
                )}
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
            </div>
        </div>
      </div>
    </header>
  );
}
