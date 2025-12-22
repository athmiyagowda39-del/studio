
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  const reports = [
    'LEAD REPORT',
    'LEAD UPDATE STATUS REPORT',
    'LEAD UPLOAD STATUS REPORT',
    'MANAGER LIST REPORT',
    'DEMO GIVEN STATUS REPORT',
    'QUOTE SENT REPORT',
    'LEAD SOURCE STATUS REPORT',
    'DEALER LIST REPORT',
    'MAPPING INFORMATION REPORT',
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {reports.map((report, index) => (
            <div key={index} className="p-4 border rounded-md text-center">
              {report}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
