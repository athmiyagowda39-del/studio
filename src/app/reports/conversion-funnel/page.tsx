
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
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

const getFunnelData = (leads: LeadFormData[]) => {
  const stageOrder: { [key: string]: number } = {
    'Not viewed': 0,
    'Unattended': 0,
    'Attended': 1,
    'Not interested': 1,
    'Do Not Contact': 1,
    'Demo Given': 2,
    'Quote Sent': 2,
    'Proposal Sent': 2,
    'Pursuing to Purchase': 3,
    'Order closed': 4,
  };

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
  const { user, isAuthenticated, isLoading, leads: allLeads } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const visibleLeads = useMemo(() => {
    if (!user || !allLeads) return [];
    if (user.role === 'Executive') {
      return allLeads.filter(lead => lead.executive === user.username);
    }
    return allLeads;
  }, [allLeads, user]);

  const funnelData = useMemo(() => {
    if (!visibleLeads) return [];
    return getFunnelData(visibleLeads);
  }, [visibleLeads]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <Card className="h-full flex flex-col">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">CONVERSION FUNNEL REPORT</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex items-center justify-center">
          <div className="w-full">
            <ConversionFunnelChart data={funnelData} />
          </div>
        </CardContent>
      </Card>
    </AppContent>
  );
}
