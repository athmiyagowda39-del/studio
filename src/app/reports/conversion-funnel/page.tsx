
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import AppContent from '@/components/layout/app-content';
import { useAuth } from '@/context/auth-context';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

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
    // PRE-FUNNEL
    'Not viewed': 0,
    'Unattended': 0,
    
    // FUNNEL STAGE 1: Attended
    'Attended': 1,
    'Not interested': 1,
    'Do Not Contact': 1,
    
    // FUNNEL STAGE 2: Demo Given (includes quote/proposal as equivalent effort)
    'Demo Given': 2,
    'Quote Sent': 2,
    'Proposal Sent': 2,

    // FUNNEL STAGE 3: Pursuing to Purchase
    'Pursuing to Purchase': 3,
    
    // FUNNEL STAGE 4: Order closed
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">CONVERSION FUNNEL REPORT</CardTitle>
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
