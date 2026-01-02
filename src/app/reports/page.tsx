
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ReportsPage() {
  const reports = [
    { name: 'LEAD REPORT', href: '/reports/lead-report' },
    { name: 'Conversion Funnel Report', href: '/reports/conversion-funnel' },
    { name: 'Geography-wise Performance Report' },
    { name: 'Product-wise Performance Report' },
    { name: 'Sales Forecast Report' },
    { name: 'Cost Analysis Report (CPL & CPA)' },
    { name: 'LEAD UPDATE STATUS REPORT' },
    { name: 'LEAD UPLOAD STATUS REPORT' },
    { name: 'MANAGER LIST REPORT' },
    { name: 'LEAD SOURCE STATUS REPORT' },
    { name: 'DEALER LIST REPORT' },
    { name: 'MAPPING INFORMATION REPORT' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {reports.map((report, index) =>
            report.href ? (
              <Link
                href={report.href}
                key={index}
                className="block p-4 border rounded-md text-center hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {report.name}
              </Link>
            ) : (
              <div key={index} className="p-4 border rounded-md text-center">
                {report.name}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
