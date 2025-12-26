'use client';

import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Target } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const authContext = useContext(AuthContext);
  const { toast } = useToast();

  const handleLogin = () => {
    if (username.toLowerCase() !== 'athmiya') {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username.',
      });
      return;
    }
    const success = authContext?.login(password);
    if (!success) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid password.',
      });
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background py-12">
       <Image
        src="https://images.unsplash.com/photo-1620336049257-2a84b431a436?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Sales illustration"
        fill
        className="object-cover opacity-20"
        data-ai-hint="sales illustration"
      />
      <div className="relative z-10 mx-auto grid w-[380px] gap-6">
        <div className="grid gap-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Sales Lead Tracking</h1>
          </div>
          <p className="text-balance text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>
        </div>
         <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button type="submit" className="w-full" onClick={handleLogin}>
              Login
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-4 bg-background/80 backdrop-blur-sm border-dashed">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-center">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground text-center p-4">
            <p>Username: <span className="font-semibold text-foreground">athmiya</span></p>
            <p>Password: <span className="font-semibold text-foreground">password</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
