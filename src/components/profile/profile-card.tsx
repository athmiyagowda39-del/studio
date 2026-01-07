'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User as UserIcon } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/placeholder-images.d';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function ProfileCard() {
  const { toast } = useToast();
  const [userAvatar, setUserAvatar] = useState<ImagePlaceholder | undefined>();
  const { user, logout } = useAuth();
  const router = useRouter();

  const userName = user?.username || 'User';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    setUserAvatar(
      PlaceHolderImages.find((img) => img.id === 'user-avatar')
    );
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password and confirm password do not match.',
      });
      return;
    }
    
    toast({
      title: 'Password Changed',
      description: 'Your password has been successfully updated.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordDialogOpen(false);
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            {userAvatar ? (
              <Image
                src={userAvatar.imageUrl}
                alt={userAvatar.description}
                width={96}
                height={96}
                className="rounded-full object-cover"
                data-ai-hint={userAvatar.imageHint}
              />
            ) : (
              <AvatarFallback>
                <UserIcon className="h-16 w-16 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="text-2xl">{userName}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Separator />
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-base"
              >
                <UserIcon className="mr-3 h-5 w-5" />
                Profile
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 text-center text-sm text-muted-foreground">
                Username: {userName}
              </div>
            </CollapsibleContent>
          </Collapsible>
          <Separator />
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-base"
              >
                <Lock className="mr-3 h-5 w-5" />
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
                      required
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
                      required
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
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Update Password</Button>
                  <DialogClose asChild>
                     <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Separator />

          <Button
            variant="ghost"
            className="w-full justify-start text-base text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
          <Separator />
        </CardContent>
      </Card>
    </div>
  );
}
