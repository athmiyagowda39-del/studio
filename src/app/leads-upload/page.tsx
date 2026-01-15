
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import dynamic from 'next/dynamic';

const LeadUploadForm = dynamic(
  () => import('@/components/leads/lead-upload-form'),
  { 
    ssr: false,
    loading: () => <p>Loading form...</p>
  }
);

export default function LeadsUploadPage() {
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
