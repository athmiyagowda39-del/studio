'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  UserCog,
  Lock,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
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
import type { ImagePlaceholder } from '@/lib/placeholder-images';

export default function ProfileCard() {
  const { toast } = useToast();
  const [userAvatar, setUserAvatar] = useState<ImagePlaceholder | undefined>();
  const [userName, setUserName] = useState('ATHMIYA');
  const [nameInput, setNameInput] = useState(userName);

  useEffect(() => {
    // This will only run on the client, after initial hydration
    import('@/lib/placeholder-images').then((images) => {
      setUserAvatar(
        images.PlaceHolderImages.find((img) => img.id === 'user-avatar')
      );
    });
  }, []);

  const handleLogout = () => {
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    // In a real app, you would redirect to a login page.
    // window.location.href = '/login';
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(nameInput);
    toast({
      title: 'Profile Updated',
      description: 'Your name has been successfully updated.',
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Password Changed',
      description: 'Your password has been successfully updated.',
    });
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
          <h2 className="text-2xl font-bold">{userName}</h2>

          <div className="w-full space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <UserCog className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateName}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="submit">Save changes</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

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
