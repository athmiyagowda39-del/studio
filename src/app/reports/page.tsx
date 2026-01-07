'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '../app-content';
import Link from 'next/link';

export default function ReportsPage() {
  const reports = [
    { name: 'LEAD REPORT', href: '/reports/lead-report' },
    { name: 'Conversion Funnel Report', href: '/reports/conversion-funnel' },
    { name: 'Geography-wise Performance Report', href: '/reports' },
    { name: 'Product-wise Performance Report', href: '/reports' },
    { name: 'Sales Forecast Report', href: '/reports' },
    { name: 'Cost Analysis Report (CPL & CPA)', href: '/reports' },
    { name: 'LEAD UPDATE STATUS REPORT', href: '/reports/lead-update-status' },
    { name: 'LEAD UPLOAD STATUS REPORT', href: '/reports/lead-upload-status' },
  ];

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
