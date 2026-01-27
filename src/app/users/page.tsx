
'use client';

import { useState, useEffect } from 'react';
import AppContent from '@/components/layout/app-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUsers, type AppUser } from '@/context/users-context';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function UsersPage() {
  const {
    originalUser,
    isAuthenticated,
    isLoading,
    impersonate,
    isImpersonating,
  } = useAuth();
  const router = useRouter();
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const { toast } = useToast();

  // State for the Add/Edit form
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<
    'Super Admin' | 'Admin' | 'Sub Admin' | 'Executive' | ''
  >('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // State for delete confirmation
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated || !['Admin', 'Sub Admin', 'Super Admin'].includes(originalUser?.role as string))
    ) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, originalUser, isLoading, router]);

  if (
    isLoading ||
    !isAuthenticated ||
    !['Admin', 'Sub Admin', 'Super Admin'].includes(originalUser?.role as string)
  ) {
    return null; // or a loading skeleton
  }

  const resetForm = () => {
    setEditingUserId(null);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('');
    setShowNewPassword(false);
  };

  const handleSaveUser = async () => {
    if (editingUserId) {
      // Update existing user
      if (!newUsername.trim() || !newEmail.trim() || !newRole) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Username, email, and role are required.',
        });
        return;
      }

      const updates: Partial<Omit<AppUser, 'id'>> = {
        username: newUsername,
        email: newEmail,
        role: newRole,
      };

      // Password update for other users is a sensitive operation and
      // generally requires backend logic (e.g., Cloud Functions) for security.
      // We are only updating Firestore data here. Password changes should be
      // done by the user themselves via their profile page.
      if (newPassword.trim()) {
        toast({
          variant: 'destructive',
          title: 'Password Not Changed',
          description: 'Admin cannot change another user\'s password directly.',
        });
      }

      await updateUser(editingUserId, updates);
      toast({
        title: 'User Updated',
        description: `User "${newUsername}"'s details have been updated.`,
      });
    } else {
      // Add new user
      if (
        !newUsername.trim() ||
        !newPassword.trim() ||
        !newEmail.trim() ||
        !newRole
      ) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'All fields are required.',
        });
        return;
      }
      if (
        users.some(
          (u) =>
            u.username.toLowerCase() === newUsername.toLowerCase() ||
            u.email.toLowerCase() === newEmail.toLowerCase()
        )
      ) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Username or Email already exists.',
        });
        return;
      }
      try {
        await addUser({
          username: newUsername,
          email: newEmail,
          role: newRole,
          password: newPassword,
        });
        toast({
          title: 'User Added',
          description: `User "${newUsername}" has been created and added to the list.`,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error creating user',
          description: error.code === 'auth/email-already-in-use' ? 'This email is already in use.' : 'Could not create user.',
        });
      }
    }
    resetForm();
  };

  const handleEditClick = (user: AppUser) => {
    setEditingUserId(user.id);
    setNewUsername(user.username);
    setNewEmail(user.email);
    setNewPassword(''); // Don't pre-fill password
    setNewRole(user.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (originalUser?.id === userToDelete.id) {
      toast({
        variant: 'destructive',
        title: 'Action Forbidden',
        description: 'You cannot delete your own account.',
      });
      setUserToDelete(null);
      return;
    }

    await deleteUser(userToDelete.id);
    toast({
      title: 'User Deleted',
      description: `User "${userToDelete.username}" has been removed. Note: The auth record may persist.`,
    });
    setUserToDelete(null);
  };

  const handleImpersonate = (userToImpersonate: AppUser) => {
    if (userToImpersonate.role === 'Super Admin') {
      toast({
        variant: 'destructive',
        title: 'Action Forbidden',
        description: 'Super Admins cannot be impersonated.',
      });
      return;
    }
    if (originalUser?.email === userToImpersonate.email) {
      toast({
        variant: 'destructive',
        title: 'Action not allowed',
        description: 'You cannot impersonate yourself.',
      });
      return;
    }
    if (
      userToImpersonate.role === 'Admin' &&
      originalUser?.role === 'Admin'
    ) {
      toast({
        variant: 'destructive',
        title: 'Action Forbidden',
        description: 'An admin cannot impersonate another admin.',
      });
      return;
    }
    impersonate({
      id: userToImpersonate.id,
      username: userToImpersonate.username,
      email: userToImpersonate.email,
      role: userToImpersonate.role,
    });
  };

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              Manage Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Add/Edit User Form */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {editingUserId
                  ? `Editing: ${newUsername}`
                  : 'Add New User'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email"
                    autoComplete="off"
                    disabled={!!editingUserId}
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={
                      editingUserId
                        ? 'Cannot change password'
                        : 'Enter password'
                    }
                    autoComplete="new-password"
                    disabled={!!editingUserId}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 bottom-1 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(
                      value: 'Super Admin' | 'Admin' | 'Sub Admin' | 'Executive'
                    ) => setNewRole(value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Sub Admin">Sub Admin</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      {originalUser?.role === 'Super Admin' && (
                         <SelectItem value="Super Admin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveUser} className="w-full">
                    {editingUserId
                      ? 'Update User'
                      : 'Add User'}
                  </Button>
                  {editingUserId && (
                    <Button onClick={resetForm} variant="outline">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Users Table */}
             {!isImpersonating && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Existing Users</h2>
                <p className="text-sm text-muted-foreground">
                  Click on a username to impersonate and view their dashboard.
                </p>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right w-[120px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const canImpersonate = originalUser?.role === 'Super Admin' || (originalUser?.role === 'Admin' && user.role !== 'Admin' && user.role !== 'Super Admin') || (originalUser?.role === 'Sub Admin' && user.role === 'Executive');
                          
                          return (
                            <TableRow key={user.id}>
                              <TableCell>
                                {canImpersonate ? (
                                  <Button
                                    variant="link"
                                    className="p-0 h-auto font-medium"
                                    onClick={() => handleImpersonate(user)}
                                  >
                                    {user.username}
                                  </Button>
                                ) : (
                                  <span className="font-medium px-1">
                                    {user.username}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(user)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit User</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setUserToDelete(user)}
                                  disabled={originalUser?.id === user.id}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete User</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user record for{' '}
              <span className="font-semibold">{userToDelete?.username}</span> from Firestore. It will not delete the Firebase Authentication user, which must be done from the Firebase console.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContent>
  );
}
