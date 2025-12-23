'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { AuthContext } from '@/context/auth-context';

export default function ProfileCard() {
  const { toast } = useToast();
  const [userAvatar, setUserAvatar] = useState<ImagePlaceholder | undefined>();
  const [userName] = useState('ATHMIYA');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const authContext = useContext(AuthContext);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    import('@/lib/placeholder-images').then((images) => {
      setUserAvatar(
        images.PlaceHolderImages.find((img) => img.id === 'user-avatar')
      );
    });
  }, []);

  const handleLogout = () => {
    authContext?.logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password and confirm password do not match.',
      });
      return;
    }
    if (!authContext) return;

    const success = authContext.changePassword(currentPassword, newPassword);

    if (success) {
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Your current password was incorrect.',
      });
    }
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">PROFILE</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <Avatar className="h-32 w-32">
            {userAvatar ? (
              <Image
                src={userAvatar.imageUrl}
                alt={userAvatar.description}
                width={128}
                height={128}
                className="rounded-full"
                data-ai-hint={userAvatar.imageHint}
              />
            ) : (
              <AvatarFallback>
                <UserIcon className="h-24 w-24 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="w-full space-y-2">
            <Collapsible open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                  <ChevronDown
                    className={cn(
                      'ml-auto h-4 w-4 transition-transform',
                      isProfileOpen && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md border px-4 py-2 font-medium">
                  {userName}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="current-password"
                        className="text-right"
                      >
                        Current
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="col-span-3"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        New
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="col-span-3"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="confirm-password"
                        className="text-right"
                      >
                        Confirm
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="col-span-3"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="submit">Update Password</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
