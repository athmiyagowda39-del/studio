
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import AppContent from '@/components/layout/app-content';
import { useAuth } from '@/context/auth-context';
import dynamic from 'next/dynamic';

const ConversionFunnelChart = dynamic(
  () => import('@/components/reports/conversion-funnel-chart'),
  { ssr: false, loading: () => <div className="h-[400px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

const funnelStages = [
  'Total Leads',
  'Attended',
  'Demo Given',
  'Pursuing to Purchase',
  'Order closed',
];

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};


const getFunnelData = (leads: LeadFormData[]) => {
  // Define the order of progression through the funnel.
  const stageOrder: { [key: string]: number } = {
    'Not viewed': 0,
    'Unattended': 0,
    'Contacted': 1,
    'Attended': 1,
    'Not interested': 1,
    'Do Not Contact': 1,
    'Demo Given': 2,
    'Pursuing to Purchase': 3,
    'Quote Sent': 3,
    'Proposal Sent': 3,
    'Order closed': 4,
  };

  // Initialize counts for each stage of our desired funnel.
  const statusCounts = {
    'Total Leads': leads.length,
    'Attended': 0,
    'Demo Given': 0,
    'Pursuing to Purchase': 0,
    'Order closed': 0,
  };

  // For stages after Attended, we only count leads on a "positive" path.
  const positivePathStatuses = [
    'Attended',
    'Demo Given',
    'Pursuing to Purchase',
    'Quote Sent',
    'Proposal Sent',
    'Order closed',
  ];

  // Attended is any lead that has been contacted.
  statusCounts['Attended'] = leads.filter(
    (lead) => (stageOrder[lead.status || ''] || 0) >= 1
  ).length;

  // Subsequent stages are cumulative but only for positive paths.
  const positiveLeads = leads.filter((lead) =>
    positivePathStatuses.includes(lead.status || '')
  );

  positiveLeads.forEach((lead) => {
    const leadStageIndex = stageOrder[lead.status || ''] || 0;
    if (leadStageIndex >= 2) statusCounts['Demo Given']++;
    if (leadStageIndex >= 3) statusCounts['Pursuing to Purchase']++;
    if (leadStageIndex >= 4) statusCounts['Order closed']++;
  });

  return funnelStages.map((stage) => ({
    name: stage,
    value: statusCounts[stage as keyof typeof statusCounts],
  }));
};

export default function ConversionFunnelReportPage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let leads = getLeadsFromLocalStorage();
    if(user?.role === 'Executive') {
      leads = leads.filter(lead => lead.executive === user.username);
    }
    setAllLeads(leads);
  }, [user]);


  const funnelData = useMemo(() => {
    if (!allLeads) return [];
    return getFunnelData(allLeads);
  }, [allLeads]);

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">Conversion Funnel Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <ConversionFunnelChart data={funnelData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
