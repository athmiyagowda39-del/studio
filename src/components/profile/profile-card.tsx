'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User as UserIcon, Mail } from 'lucide-react';
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
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ProfileCard() {
  const { toast } = useToast();
  const [userAvatar, setUserAvatar] = useState<ImagePlaceholder | undefined>();
  const { user, firebaseUser, logout } = useAuth();
  const router = useRouter();

  const userName = user?.username ? user.username.toUpperCase() : 'USER';
  const userEmail = user?.email || 'N/A';

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
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser || !firebaseUser.email) {
       toast({ variant: 'destructive', title: 'Error', description: 'Not logged in or user email is missing.' });
       return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password and confirm password do not match.',
      });
      return;
    }

    if (newPassword.length < 6) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
      });
      return;
    }

    try {
      // Re-authenticate the user before changing the password for security
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // If re-authentication is successful, update the password
      await updatePassword(firebaseUser, newPassword);
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);

    } catch (error: any) {
        let description = 'An error occurred.';
        if (error.code === 'auth/wrong-password') {
            description = 'The current password you entered is incorrect.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The new password is too weak. It must be at least 6 characters long.';
        }
        toast({ variant: 'destructive', title: 'Password Change Failed', description: description });
    }
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
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          <Separator />
          
          <div className="py-2">
            <div className="flex items-center text-sm">
                <UserIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Username:</span>
                <span className="ml-2">{user?.username}</span>
            </div>
            <div className="flex items-center mt-2 text-sm">
                <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Role:</span>
                <span className="ml-2">{user?.role}</span>
            </div>
          </div>
          
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
