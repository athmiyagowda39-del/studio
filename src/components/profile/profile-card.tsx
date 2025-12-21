'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, User as UserIcon, Lock, LogOut, UserCog } from 'lucide-react';

export default function ProfileCard() {
  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">PROFILE</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <Avatar className="h-32 w-32">
            <AvatarFallback>
              <UserIcon className="h-24 w-24 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-xl">
                ATHMIYA
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <UserCog className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Lock className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-full space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <UserCog className="mr-4 h-5 w-5" />
              <span>EDIT PROFILE</span>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Lock className="mr-4 h-5 w-5" />
              <span>CHANGE PASSWORD</span>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <LogOut className="mr-4 h-5 w-5" />
              <span>LOGOUT</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
