'use client';

import { useState, useEffect } from 'react';
import AppContent from '../app-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function UsersPage() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { users, addUser } = useUsers();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Executive'>('Executive');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || currentUser?.role !== 'Admin')) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, currentUser, isLoading, router]);

  if (isLoading || !isAuthenticated || currentUser?.role !== 'Admin') {
    return null; // or a loading skeleton
  }
  
  const handleAddUser = () => {
    if (!newUsername.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Username cannot be empty.',
      });
      return;
    }
    if(users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Username already exists.',
        });
        return;
    }

    addUser({ username: newUsername, role: newRole });
    toast({
      title: 'User Added',
      description: `User "${newUsername}" has been added with the role "${newRole}".`,
    });
    setNewUsername('');
    setNewRole('Executive');
  };

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">Manage Users</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Add User Form */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newRole} onValueChange={(value: 'Admin' | 'Executive') => setNewRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUser}>Add User</Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Existing Users</h2>
              <Card>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.role}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
