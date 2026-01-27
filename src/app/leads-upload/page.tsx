
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import LeadUploadForm from '@/components/leads/lead-upload-form';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LeadsUploadPage() {
  const { isAuthenticated, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
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
