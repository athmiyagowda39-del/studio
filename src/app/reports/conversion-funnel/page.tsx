
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConversionFunnelChart from '@/components/reports/conversion-funnel-chart';
import { useState, useMemo, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { getLeadData, type Lead } from '@/lib/data';

const funnelStages = [
  'Total Leads',
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
    'Contacted',
    'Qualified',
    'Unqualified',
    'Follow-up Required',
    'Fake Lead',
    'Existing Customer',
    'Do Not Contact',
    'Quote Sent',
];

const specificSectors = ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Retail', 'Hospitality', 'Telecommunication', 'Construction', 'Real Estate', 'Media & Entertainment', 'Government', 'Non-profit', 'Other'];


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
    // Get the numeric progression level for the lead's current status.
    // Default to 0 if status is unknown or not in the progression path.
    const leadStageIndex = stageOrder[lead.status || ''] || 0;

    // A lead that has reached a certain stage has also reached all previous stages.
    if (leadStageIndex >= 1) { // Attended / Contacted
      statusCounts['Attended']++;
    }
    if (leadStageIndex >= 2) { // Demo Given
      statusCounts['Demo Given']++;
    }
    if (leadStageIndex >= 3) { // Pursuing / Quote Sent
      statusCounts['Pursuing to Purchase']++;
    }
    if (leadStageIndex >= 4) { // Order Closed
      statusCounts['Order closed']++;
    }
  });

  return funnelStages.map(stage => ({
    name: stage,
    value: statusCounts[stage as keyof typeof statusCounts],
  }));
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
