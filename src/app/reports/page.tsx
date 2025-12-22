
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  const reports = [
    'Conversion Funnel Report (Lead → Demo → Quote → Closure)',
    'Geography-wise Performance Report',
    'Product-wise Performance Report',
    'Sales Forecast Report',
    'Cost Analysis Report (CPL & CPA)',
    'Complete Lead Report',
    'Lead Update Status Report',
    'Lead Upload Status Report',
    'Manager List Report',
    'Demo Given Status Report',
    'Quote sent report with filters (recent leads, leads not viewed, etc.)',
    'Lead Source Status Report',
    'Dealer List Report',
    'Mapping information Report',
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-disc list-inside text-muted-foreground">
            {reports.map((report, index) => (
              <li key={index}>{report}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
