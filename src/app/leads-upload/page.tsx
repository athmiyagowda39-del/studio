
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import LeadUploadForm from '@/components/leads/lead-upload-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LeadsUploadPage() {
  const { isAuthenticated, isLoading, originalUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && originalUser?.role === 'Sub Admin') {
      router.replace('/users');
    }
  }, [isAuthenticated, isLoading, router, originalUser]);

  if (isLoading || !isAuthenticated || originalUser?.role === 'Sub Admin') {
    return null; // or a loading skeleton
  }
  
  return (
    <AppContent>
        <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">LEADS UPLOAD</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
            <LeadUploadForm />
            </CardContent>
        </Card>
        </div>
    </AppContent>
  );
}
