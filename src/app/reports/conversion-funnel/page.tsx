
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
  // Define the order of progression through the funnel. Each status is assigned a level.
  const stageOrder: { [key: string]: number } = {
    // Level 0: Not yet contacted
    'Not viewed': 0,
    'Unattended': 0,
    
    // Level 1: Initial contact made
    'Attended': 1,
    'Not interested': 1, // Also "attended", but with a negative outcome
    'Do Not Contact': 1, // Also "attended"
    
    // Level 2: Qualified, demo or quote provided
    'Demo Given': 2,
    
    // Level 3: Actively pursuing a deal
    'Pursuing to Purchase': 3,
    'Quote Sent': 3,
    'Proposal Sent': 3,
    
    // Level 4: Deal won
    'Order closed': 4,
  };

  // Calculate the counts for each funnel stage cumulatively.
  const statusCounts = {
    'Total Leads': leads.length,
    'Attended': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 1).length,
    'Demo Given': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 2).length,
    'Pursuing to Purchase': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 3).length,
    'Order closed': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 4).length,
  };

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
