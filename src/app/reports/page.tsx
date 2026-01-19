
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ReportsPage() {
  const { isAuthenticated, isLoading, originalUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && originalUser?.role === 'Sub Admin') {
      router.replace('/users');
    }
  }, [isAuthenticated, isLoading, router, originalUser]);

  const reports = [
    { name: 'LEAD REPORT', href: '/reports/lead-report' },
    { name: 'CONVERSION FUNNEL REPORT', href: '/reports/conversion-funnel' },
    { name: 'LEAD UPDATE STATUS REPORT', href: '/reports/lead-update-status' },
    { name: 'LEAD UPLOAD STATUS REPORT', href: '/reports/lead-upload-status' },
  ];

  if (isLoading || !isAuthenticated || originalUser?.role === 'Sub Admin') {
    return null;
  }

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Link key={report.name} href={report.href} passHref>
                <div className="p-4 border rounded-md text-center text-foreground hover:bg-accent cursor-pointer">
                  {report.name}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
