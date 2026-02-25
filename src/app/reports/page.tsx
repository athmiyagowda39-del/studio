
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const reports = [
    { name: 'LEAD REPORT', href: '/reports/lead-report' },
    { name: 'CONTRACT VALUES REPORT', href: '/reports/contract-values' },
    { name: 'CONVERSION FUNNEL REPORT', href: '/reports/conversion-funnel' },
    { name: 'LEAD UPDATE STATUS REPORT', href: '/reports/lead-update-status' },
    { name: 'LEAD UPLOAD STATUS REPORT', href: '/reports/lead-upload-status' },
    { name: 'AUDIT LOG REPORT', href: '/reports/audit-log', roles: ['Super Admin', 'Admin', 'Manager'] },
  ];
  
  const visibleReports = reports.filter(report => {
    if (!report.roles) return true;
    if (!user) return false;
    return report.roles.includes(user.role);
  });


  if (isLoading || !isAuthenticated) {
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
            {visibleReports.map((report) => (
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
