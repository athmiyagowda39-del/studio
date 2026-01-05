'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/auth-context';

type UserRole = 'admin' | 'user';

export default function ManageUsersPage() {
  const authContext = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  useEffect(() => {
    if (authContext && !authContext.isAuthLoading && authContext.user?.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
      });
      router.push('/');
    }
  }, [authContext, router, toast]);

  if (!authContext || authContext.isAuthLoading || authContext.user?.role !== 'admin') {
    return null; // or a loading spinner
  }

  const { users, addUser, removeUser } = authContext;

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a username and password.',
      });
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
         toast({
            variant: 'destructive',
            title: 'User Exists',
            description: 'A user with this username already exists.',
        });
        return;
    }
    
    const success = await addUser(newUsername, newPassword, newRole);

    if (success) {
      toast({
        title: 'User Added',
        description: `User "${newUsername}" has been successfully created.`,
      });
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Add User',
        description: 'Could not create the user. They may already exist or an error occurred.',
      });
    }
  };

  const handleRemoveUser = async (username: string) => {
    if (username === authContext.user?.username) {
        toast({
            variant: 'destructive',
            title: 'Action Forbidden',
            description: 'You cannot remove yourself.',
        });
        return;
    }
    await removeUser(username);
    toast({
      title: 'User Removed',
      description: `User "${username}" has been removed.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddUser}>Add User</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.username}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.username)}
                      disabled={user.username === authContext.user?.username}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Remove User</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
