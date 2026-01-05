'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import Link from 'next/link';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createUser } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
      });
      return;
    }
    if (!username || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please enter a username and password.',
      });
      return;
    }

    setIsLoading(true);
    // All new signups are standard 'user' role
    const result = await createUser(username, password, 'user');
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Account Created',
        description: 'You can now log in with your new credentials.',
      });
      router.push('/login');
    } else {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
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
            <h1 className="text-3xl font-bold">Sales Lead Tracking</h1>
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button
            className="w-full"
            onClick={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
           <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Log in
              </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
