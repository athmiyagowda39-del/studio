
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LeadStatusChart from '@/components/reports/lead-status-chart';

const leadStatuses = [
  { status: 'Total Leads', value: 890 },
  { status: 'Not viewed', value: 32 },
  { status: 'Unattended', value: 2 },
  { status: 'Not interested', value: 201 },
  { status: 'Attended', value: 500 },
  { status: 'Demo Given', value: 301 },
  { status: 'Pursuing to Purchase', value: 5 },
  { status: 'Order closed', value: 10 },
];

export default function LeadReportPage() {
  const chartData = leadStatuses
    .filter((s) => s.status !== 'Total Leads') 
    .map((item) => ({ name: item.status, value: item.value, fill: `var(--color-${item.status.replace(/\s+/g, '')})` }));


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Lead Report</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Lead Status Breakdown</h2>
              {leadStatuses.map((item) => (
                <div key={item.status} className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="font-medium">{item.status}:</span>
                  <span className="font-bold text-primary">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
               <LeadStatusChart data={chartData} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
