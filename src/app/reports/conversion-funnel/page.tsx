'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConversionFunnelChart from '@/components/reports/conversion-funnel-chart';
import { useState, useMemo } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { useAuthContext } from '@/context/auth-context';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const funnelStages = [
  'Total Leads',
  'Attended',
  'Demo Given',
  'Pursuing to Purchase',
  'Order closed',
];

const getFunnelData = (leads: LeadFormData[]) => {
  // Define the order of progression through the funnel.
  const stageOrder: { [key: string]: number } = {
    'Not viewed': 0,
    'Unattended': 0,
    'Contacted': 1,
    'Attended': 1,
    'Demo Given': 2,
    'Pursuing to Purchase': 3,
    'Quote Sent': 3,
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

  leads.forEach(lead => {
    const leadStageIndex = stageOrder[lead.status || ''] || 0;

    if (leadStageIndex >= 1) statusCounts['Attended']++;
    if (leadStageIndex >= 2) statusCounts['Demo Given']++;
    if (leadStageIndex >= 3) statusCounts['Pursuing to Purchase']++;
    if (leadStageIndex >= 4) statusCounts['Order closed']++;
  });

  return funnelStages.map(stage => ({
    name: stage,
    value: statusCounts[stage as keyof typeof statusCounts],
  }));
};

export default function ConversionFunnelReportPage() {
  const { user } = useAuthContext();
  const { firestore } = useFirebase();

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'leads'), where('subAdminId', '==', user.uid));
  }, [user, firestore]);
  const { data: allLeads } = useCollection<LeadFormData>(leadsQuery);

  const funnelData = useMemo(() => {
    if (!allLeads) return [];
    return getFunnelData(allLeads);
  }, [allLeads]);

  return (
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
  );
}
