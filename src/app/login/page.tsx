'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-context';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);
  
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { login } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Success is handled by AppContext redirecting
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter your email address.' });
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      toast({
        title: 'Reset Request Sent',
        description: data.message,
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleFocus = () => {
    setIsReadOnly(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-3xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
          PW
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            PeopleWorks
          </h1>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground/80">
            Sales Lead Tracking
          </p>
        </div>
      </div>
      
      <Card className="w-full max-w-sm border-2 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold">Welcome Back</CardTitle>
          <p className="text-xs text-center text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleLogin}
            className="grid gap-4"
            autoComplete="off"
          >
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@peopleworks.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                disabled={isSubmitting}
                readOnly={isReadOnly}
                onFocus={handleFocus}
                className="bg-muted/30 focus:bg-background transition-colors"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Password" className="font-semibold">Password</Label>
                
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 font-medium text-xs">
                      Forgot Password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address below. We'll send you a temporary password to regain access to your account.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reset-email">Email Address</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="name@peopleworks.in"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isResetting}>
                          {isResetting ? 'Sending...' : 'Send Temporary Password'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  readOnly={isReadOnly}
                  onFocus={handleFocus}
                  className="bg-muted/30 focus:bg-background transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-bold text-base mt-2 shadow-lg hover:shadow-primary/30 transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Login to Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground font-medium">
        © {new Date().getFullYear()} PeopleWorks Sales CRM System
      </p>
    </div>
  );
}
