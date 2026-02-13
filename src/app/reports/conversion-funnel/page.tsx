
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getDisplayModule } from '@/lib/modules';
import { format } from 'date-fns';

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

const getFunnelData = (leads: LeadFormData[]) => {
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
  const [isClient, setIsClient] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [stageLeads, setStageLeads] = useState<LeadFormData[]>([]);

  useEffect(() => {
    setIsClient(true);
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

  const handleStageClick = (stageName: string) => {
    if (selectedStage === stageName) {
      setSelectedStage(null);
      setStageLeads([]);
      return;
    }

    let filtered: LeadFormData[] = [];
    if (stageName === 'Total Leads') {
        filtered = visibleLeads;
    } else if (stageName === 'Attended') {
        filtered = visibleLeads.filter(l => (stageOrder[l.status || ''] || 0) >= 1);
    } else if (stageName === 'Demo Given') {
        filtered = visibleLeads.filter(l => (stageOrder[l.status || ''] || 0) >= 2);
    } else if (stageName === 'Pursuing to Purchase') {
        filtered = visibleLeads.filter(l => (stageOrder[l.status || ''] || 0) >= 3);
    } else if (stageName === 'Order closed') {
        filtered = visibleLeads.filter(l => l.status === 'Order closed');
    }
    
    setSelectedStage(stageName);
    setStageLeads(filtered);
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <Card className="h-full flex flex-col">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">CONVERSION FUNNEL REPORT</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="w-full">
            <p className="text-center text-muted-foreground mb-4">
              Showing {visibleLeads.length} total leads. Click on a funnel stage to see details.
            </p>
            {isClient && <ConversionFunnelChart data={funnelData} onStageClick={handleStageClick} />}
          </div>

          {selectedStage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Leads in Stage: "{selectedStage}" ({stageLeads.length} leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-[1200px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Lead Id</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead>Last Follow-up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stageLeads.length > 0 ? (
                        stageLeads.map((lead, index) => (
                          <TableRow key={lead.leadId}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{lead.leadId}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                            <TableCell>{lead.contactPerson}</TableCell>
                            <TableCell>{getDisplayModule(lead.selectedModule)}</TableCell>
                            <TableCell>{lead.status}</TableCell>
                            <TableCell>{lead.executive || 'N/A'}</TableCell>
                            <TableCell>
                              {lead.followUps && lead.followUps.length > 0
                                ? format(new Date(lead.followUps[lead.followUps.length - 1].date), 'PPP')
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            No leads to display for this stage.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </AppContent>
  );
}
