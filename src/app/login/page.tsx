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
    <div className="w-full min-h-screen lg:grid lg:grid-cols-3">
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto-format=fit&crop=entropy&cs=tinysrgb"
          alt="Sales team working"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
          data-ai-hint="sales team meeting"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Sales Lead Tracking</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Login</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="athmiya"
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
                  placeholder="password"
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
           <Card className="mt-4 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">Demo Credentials</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground text-center p-4 pt-0">
                <p>Username: <span className="font-semibold text-foreground">athmiya</span></p>
                <p>Password: <span className="font-semibold text-foreground">password</span></p>
              </CardContent>
            </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto-format=fit&crop=entropy&cs=tinysrgb"
          alt="Sales professional at work"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
          data-ai-hint="sales professional"
        />
      </div>
    </div>
  );
}
