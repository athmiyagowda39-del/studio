
'use client';

import { useState, useEffect } from 'react';
import AppContent from '@/components/layout/app-content';
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
import { Eye, EyeOff, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export default function UsersPage() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { users, addUser, updateUser } = useUsers();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Executive'>('Executive');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});

  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'Admin' | 'Executive'>('Executive');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || currentUser?.role !== 'Admin')) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, currentUser, isLoading, router]);

  if (isLoading || !isAuthenticated || currentUser?.role !== 'Admin') {
    return null; // or a loading skeleton
  }
  
  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim() || !newEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Username, Email, and password cannot be empty.',
      });
      return;
    }
    if(users.some(u => u.username.toLowerCase() === newUsername.toLowerCase() || u.email.toLowerCase() === newEmail.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Username or Email already exists.',
        });
        return;
    }
    
    try {
      await addUser({ username: newUsername, email: newEmail, role: newRole, password: newPassword });
      toast({
        title: 'User Added',
        description: `User "${newUsername}" has been created in Firebase and added to the list.`,
      });
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Executive');
      setShowNewPassword(false);
    } catch(error: any) {
        let description = 'Could not create user.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already in use by another account.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. It must be at least 6 characters long.';
        }
         toast({
            variant: 'destructive',
            title: 'Error creating user',
            description: description,
        });
    }
  };

  const handleEditUserClick = (user: AppUser) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPassword(user.password || ''); // Password may not be available from our list
    setEditRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!editUsername.trim() || !editEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Username and Email cannot be empty.',
      });
      return;
    }

    if (users.some(u => (u.username.toLowerCase() === editUsername.toLowerCase() || u.email.toLowerCase() === editEmail.toLowerCase()) && u.id !== editingUser.id)) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Username or email already exists.',
        });
        return;
    }
    
    // Note: This only updates the local user list (for roles, etc). 
    // It does not update the user's email or password in Firebase Auth from this dialog
    // to keep the logic simple for this prototype. Password changes are done on the profile page.
    updateUser(editingUser.id, {
      username: editUsername,
      email: editEmail,
      role: editRole,
      password: editPassword, // This might be stale, but we save it for local display
    });
    
    toast({
      title: 'User Updated',
      description: `User "${editUsername}"'s local details have been updated.`,
    });
    
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };


  const togglePasswordVisibility = (userId: string) => {
    setPasswordVisibility(prev => ({ ...prev, [userId]: !prev[userId] }));
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
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
                  />
                </div>
                 <div className="space-y-2 relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 bottom-1 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowNewPassword(prev => !prev)}
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
               <p className="text-sm text-muted-foreground">
                This table shows users stored in the application for role management. Passwords shown here might not be the user's current Firebase password if they changed it on their profile page.
              </p>
              <Card>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Password (Last Known)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     <span>
                                        {passwordVisibility[user.id] ? user.password : '••••••••'}
                                     </span>
                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground"
                                        onClick={() => togglePasswordVisibility(user.id)}
                                     >
                                        {passwordVisibility[user.id] ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                     </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEditUserClick(user)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit User</span>
                                </Button>
                            </TableCell>
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

       {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Username
              </Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select value={editRole} onValueChange={(value: 'Admin' | 'Executive') => setEditRole(value)}>
                <SelectTrigger id="edit-role" className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Executive">Executive</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContent>
  );
}
