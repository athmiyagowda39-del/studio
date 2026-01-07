'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '../app-content';

export default function ReportsPage() {
  const fields = [
    'Pin code',
    'Company',
    'Contact person',
    'Address',
    'State',
    'District',
    'Contact Number',
    'Email',
    'Reference',
    'Company headcount',
    'Sector',
    'Modules',
  ];

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">Lead Fields</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {fields.map((field, index) => (
              <div
                key={index}
                className="p-4 border rounded-md text-center text-foreground"
              >
                {field}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
