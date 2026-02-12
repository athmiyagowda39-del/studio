'use client';

import { useState, useEffect } from 'react';
import AppContent from '@/components/layout/app-content';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { useApp, type AppUser } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';
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
    users,
    addUser,
    updateUser,
    deleteUser,
  } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newRole, setNewRole] = useState<
    'Super Admin' | 'Admin' | 'Manager' | 'Executive' | ''
  >('');
  
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated ||
        !['Manager', 'Admin', 'Super Admin'].includes(
          originalUser?.role as string
        ))
    ) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, originalUser, isLoading, router]);

  if (
    isLoading ||
    !isAuthenticated ||
    !['Manager', 'Admin', 'Super Admin'].includes(originalUser?.role as string)
  ) {
    return null;
  }

  const resetForm = () => {
    setEditingUserId(null);
    setNewUsername('');
    setNewEmail('');
    setNewEmployeeId('');
    setNewRole('');
  };

  const handleSaveUser = async () => {
    if (editingUserId) {
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
        employeeId: newEmployeeId,
        role: newRole,
      };

      await updateUser(editingUserId, updates);
      toast({
        title: 'User Updated',
        description: `User "${newUsername}"'s details have been updated.`,
      });
    } else {
      if (
        !newUsername.trim() ||
        !newEmail.trim() ||
        !newRole
      ) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Username, Email, and Role are required.',
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
          employeeId: newEmployeeId,
        });
        toast({
          title: 'User Added',
          description: `User "${newUsername}" has been created with a default password.`,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error creating user',
          description: error.message || 'Could not create user.',
        });
      }
    }
    resetForm();
  };

  const handleEditClick = (user: AppUser) => {
    setEditingUserId(user.id);
    setNewUsername(user.username);
    setNewEmail(user.email);
    setNewEmployeeId(user.employeeId || '');
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
      description: `User "${userToDelete.username}" has been removed.`,
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
    impersonate(userToImpersonate);
  };

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-primary text-center">
          Manage Users
        </h1>

        <Card>
          <CardContent className="p-6 space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {editingUserId
                  ? `Editing User: ${
                      users.find((u) => u.id === editingUserId)?.username
                    }`
                  : 'Add New User'}
              </h2>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    placeholder="Enter Employee ID"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(
                      value: 'Super Admin' | 'Admin' | 'Manager' | 'Executive'
                    ) => setNewRole(value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveUser}>
                    {editingUserId ? 'Update User' : 'Add User'}
                  </Button>
                  {editingUserId && (
                    <Button onClick={resetForm} variant="outline">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {!isImpersonating && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Existing Users</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on a username to view their dashboard. Click the pencil
                  icon to edit their details in the form above.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Label htmlFor="role-filter">Filter by Role:</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger id="role-filter" className="w-[180px]">
                      <SelectValue placeholder="Filter by role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right w-[120px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => roleFilter === 'All' || user.role === roleFilter)
                      .map((mappedUser) => {
                      const canImpersonate =
                        (originalUser?.role === 'Super Admin' &&
                          mappedUser.role !== 'Super Admin') ||
                        (originalUser?.role === 'Admin' &&
                          !['Admin', 'Super Admin'].includes(mappedUser.role)) ||
                        (originalUser?.role === 'Manager' &&
                          mappedUser.role === 'Executive');

                      return (
                        <TableRow key={mappedUser.id}>
                          <TableCell>
                            {canImpersonate ? (
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium"
                                onClick={() => handleImpersonate(mappedUser)}
                              >
                                {mappedUser.username}
                              </Button>
                            ) : (
                              <span className="font-medium px-1">
                                {mappedUser.username}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{mappedUser.email}</TableCell>
                          <TableCell>{mappedUser.employeeId || 'N/A'}</TableCell>
                          <TableCell>{mappedUser.role}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(mappedUser)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit User</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(mappedUser)}
                              disabled={originalUser?.id === mappedUser.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete User</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{' '}
              <span className="font-semibold">{userToDelete?.username}</span>.
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
