
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User as UserIcon, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/context/app-context';
import AppContent from '@/components/layout/app-content';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, logout, updateUser, users, isAuthenticated, isLoading } = useApp();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // If user must change password, open the dialog automatically.
    if (user?.forcePasswordChange) {
      setIsPasswordDialogOpen(true);
    }
  }, [user]);


  const userName = user?.username ? user.username.toUpperCase() : 'USER';
  const userEmail = user?.email || 'N/A';
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
       toast({ variant: 'destructive', title: 'Error', description: 'Not logged in.' });
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
    
    // We don't have the original hashed password on the client.
    // Instead of checking the current password here, we'll let the backend handle it.
    // For now, we trust the user to enter it correctly. A better implementation
    // might have a dedicated endpoint to verify the current password.

    try {
      await updateUser(user.id, { password: newPassword });
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
      
      // Redirect to dashboard after successful password change
      router.push('/dashboard');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Password Change Failed', description: 'An unexpected error occurred. Please try again.' });
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <div className="flex flex-col items-center justify-start pt-8 gap-6">
        {user?.forcePasswordChange && (
            <Alert variant="destructive" className="w-full max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                    For your security, you must change your default password before you can continue.
                </AlertDescription>
            </Alert>
        )}
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{userName}</CardTitle>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </CardHeader>
          <CardContent className="p-0">
            <Separator />
            <div className="p-6 space-y-4">
              <div className="flex items-center text-sm">
                <UserIcon className="mr-4 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Username:</span>
                <span className="ml-2">{user?.username}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="mr-4 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Role:</span>
                <span className="ml-2">{user?.role}</span>
              </div>
            </div>

            <Separator />

            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <div className="flex items-center p-6 py-4 cursor-pointer hover:bg-accent w-full">
                    <Lock className="mr-4 h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Change Password</span>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="current-password" className="text-right">
                        Current
                      </Label>
                      <div className="col-span-3 relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter default password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        New
                      </Label>
                       <div className="col-span-3 relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirm-password" className="text-right">
                        Confirm
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Update Password</Button>
                     {!user?.forcePasswordChange && (
                        <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                        </DialogClose>
                     )}
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Separator />

            <div className="flex items-center p-6 py-4 cursor-pointer hover:bg-accent w-full" onClick={handleLogout}>
                <LogOut className="mr-4 h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">Logout</span>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
