
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createUser } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateAdmin = async () => {
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
      });
      return;
    }
    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Password is required',
      });
      return;
    }

    setIsLoading(true);
    const result = await createUser(username, password, 'admin');
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Admin User Created',
        description: 'You can now log in with your new credentials.',
      });
      router.push('/login');
    } else {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: result.message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Welcome to LeadView</h1>
          </div>
          <CardTitle className="text-2xl">Create Your Admin Account</CardTitle>
          <CardDescription>
            This is a one-time setup to create the first administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              readOnly
              className="bg-gray-100"
            />
             <p className="text-xs text-muted-foreground">The primary admin username is fixed to 'admin'.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAdmin()}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleCreateAdmin}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Admin Account'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
