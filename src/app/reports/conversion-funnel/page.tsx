
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConversionFunnelChart from '@/components/reports/conversion-funnel-chart';
import { useState, useMemo, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { getLeadData, type Lead } from '@/lib/data';

const funnelStages = [
  'Not viewed',
  'Attended',
  'Demo Given',
  'Pursuing to Purchase',
  'Order closed',
];

const leadStatusOptions = [
    'Attended',
    'Not viewed',
    'Demo Given',
    'Unattended',
    'Pursuing to Purchase',
    'Not interested',
    'Order closed',
];

const specificSectors = ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Retail', 'Hospitality', 'Telecommunication', 'Construction', 'Real Estate', 'Media & Entertainment', 'Government', 'Non-profit', 'Other'];


const getFunnelData = (leads: LeadFormData[]) => {
  const statusCounts = funnelStages.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<string, number>);

  let totalLeads = 0;

  leads.forEach(lead => {
    if (lead.status && statusCounts.hasOwnProperty(lead.status)) {
        // This logic assumes a linear progression.
        // A lead in a later stage has also passed through earlier stages.
        const stageIndex = funnelStages.indexOf(lead.status);
        for (let i = 0; i <= stageIndex; i++) {
            statusCounts[funnelStages[i]]++;
        }
    } else if (lead.status === 'Not viewed') {
        statusCounts['Not viewed']++;
    }
  });

  // Ensure that counts are not decreasing up the funnel
  for (let i = 1; i < funnelStages.length; i++) {
    if (statusCounts[funnelStages[i]] > statusCounts[funnelStages[i-1]]) {
        statusCounts[funnelStages[i-1]] = statusCounts[funnelStages[i]];
    }
  }


  const result = funnelStages.map(stage => ({
    name: stage,
    value: statusCounts[stage],
  }));

  // Add total leads as the first stage if it's greater than "Not viewed"
  const totalNotViewed = leads.filter(l => l.status === 'Not viewed').length;
  const totalLeadsCount = leads.length;

  return [
      { name: 'Total Leads', value: totalLeadsCount },
      ...result
  ]
};

export default function ConversionFunnelReportPage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);

   useEffect(() => {
    try {
      const storedLeads = localStorage.getItem('uploadedLeads');
       const generatedLeads = getLeadData();

      let leadsFromStorage: LeadFormData[] = [];
      if (storedLeads) {
        leadsFromStorage = JSON.parse(storedLeads).map((lead: LeadFormData, index: number) => ({
            ...lead,
            status: lead.status || leadStatusOptions[index % leadStatusOptions.length],
            sector: lead.sector || specificSectors[index % specificSectors.length],
        }));
      }
      
      const combinedLeads: LeadFormData[] = [...leadsFromStorage, ...generatedLeads.map((lead: Lead, index: number) => {
        const date = new Date(lead.date);
        return {
            leadId: `GEN-${date.getTime()}-${index}`,
            pincode: '',
            state: lead.state,
            district: lead.city,
            address: `${lead.city}, ${lead.state}`,
            company: `Company ${index}`,
            contactPerson: `Person ${index}`,
            contactNumber: `999999999${index % 10}`,
            email: `person${index}@example.com`,
            reference: 'Generated',
            headcount: `${Math.floor(Math.random() * 1000) + 1}`,
            sector: specificSectors[index % specificSectors.length],
            selectedModule: 'AR',
            toDealer: false,
            creationDate: date.getTime(),
            status: leadStatusOptions[index % leadStatusOptions.length],
        } as LeadFormData
      })];

      const leadsWithStatus = combinedLeads.map((lead, index) => ({
          ...lead,
          status: lead.status || leadStatusOptions[index % leadStatusOptions.length],
          sector: lead.sector || specificSectors[index % specificSectors.length],
          headcount: lead.headcount || `${Math.floor(Math.random() * 1000) + 1}`,
          creationDate: lead.creationDate ? new Date(lead.creationDate).getTime() : new Date().getTime(),
        }));
      
      setAllLeads(leadsWithStatus);
    } catch (error) {
      console.error('Failed to load leads', error);
    }
  }, []);

  const funnelData = useMemo(() => {
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
