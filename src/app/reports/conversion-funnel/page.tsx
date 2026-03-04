'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState, useEffect, useRef } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ConversionFunnelChart = dynamic(
  () => import('@/components/reports/conversion-funnel-chart'),
  { ssr: false, loading: () => <div className="h-[400px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

// Helper component for expandable "box" view
function ExpandableCell({ content, title }: { content: string | null | undefined, title: string }) {
  if (!content || content === 'N/A') return <span className="text-muted-foreground">N/A</span>;
  
  const isShort = content.length < 35;

  if (isShort) {
    return <span>{content}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="flex items-center gap-2 cursor-pointer group transition-colors hover:text-primary max-w-[200px]"
        >
          <span className="flex-1 truncate">{content}</span>
          <span className="shrink-0 text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-sm opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            VIEW
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 shadow-2xl border-2 z-50 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase text-primary border-b pb-1 tracking-wider">{title}</h4>
          <div className="text-sm whitespace-normal break-words leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {content}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const getFunnelData = (leads: LeadFormData[]) => {
  const total = leads.length;
  
  // Leads Processed: Everything except 'Not viewed'
  const processed = leads.filter(l => l.status !== 'Not viewed').length;
  
  // Attended
  const attended = leads.filter(l => l.status === 'Attended').length;
  
  // Demo Given
  const demo = leads.filter(l => l.status === 'Demo Given').length;
  
  // Proposal Sent (including Quote Sent)
  const proposal = leads.filter(l => l.status === 'Proposal Sent' || l.status === 'Quote Sent').length;
  
  // Pursuing to Purchase
  const pursuing = leads.filter(l => l.status === 'Pursuing to Purchase').length;
  
  // Order Closed
  const closed = leads.filter(l => l.status === 'Order closed').length;

  const rawData = [
    { name: 'Total Leads', value: total },
    { name: 'Leads Processed', value: processed },
    { name: 'Attended', value: attended },
    { name: 'Demo Given', value: demo },
    { name: 'Proposal Sent', value: proposal },
    { name: 'Pursuing to Purchase', value: pursuing },
    { name: 'Order Closed', value: closed },
  ];

  // Only show stages with counts > 0 to keep the funnel meaningful
  return rawData.filter(item => item.value > 0);
};

export default function ConversionFunnelReportPage() {
  const { user, isAuthenticated, isLoading, leads: allLeads, leadStatuses, modules } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

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

  const stageLeads = useMemo(() => {
    if (!selectedStage || !visibleLeads) return [];

    if (selectedStage === 'Total Leads') {
        return visibleLeads;
    }
    
    if (selectedStage === 'Leads Processed') {
        return visibleLeads.filter(l => l.status !== 'Not viewed');
    }
    
    if (selectedStage === 'Proposal Sent') {
        return visibleLeads.filter(l => l.status === 'Proposal Sent' || l.status === 'Quote Sent');
    }

    return visibleLeads.filter(l => l.status === selectedStage);
  }, [selectedStage, visibleLeads]);

  const handleStageClick = (stageName: string) => {
    if (selectedStage === stageName) {
      setSelectedStage(null);
    } else {
      setSelectedStage(stageName);
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">CONVERSION FUNNEL REPORT</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="w-full">
            <p className="text-center text-muted-foreground mb-4">
              Showing distribution for {visibleLeads.length} total leads. Only stages with counts &gt; 0 are displayed.
            </p>
            <div className="bg-background rounded-xl p-4 flex justify-center">
              {isClient && <ConversionFunnelChart data={funnelData} onStageClick={handleStageClick} />}
            </div>
          </div>

          {selectedStage && (
            <Card ref={detailsRef} className="border-2 border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Leads in Stage: <span className="text-primary font-bold">"{selectedStage}"</span> ({stageLeads.length} records)</span>
                  <button 
                    onClick={() => setSelectedStage(null)} 
                    className="text-xs font-bold uppercase text-muted-foreground hover:text-primary transition-colors border px-2 py-1 rounded bg-background"
                  >
                    Close Table
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-[3000px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Lead Id</TableHead>
                        <TableHead>Lead Date</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Emailid</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Last Followed Date</TableHead>
                        <TableHead>Enter by</TableHead>
                        <TableHead>Next followup Date</TableHead>
                        <TableHead>Last Followup Remarks</TableHead>
                        <TableHead>Lead Status</TableHead>
                        <TableHead>Lead Status Remarks</TableHead>
                        <TableHead>Given By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stageLeads.length > 0 ? (
                        stageLeads.map((lead, index) => {
                          const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                          const nextFollowupDate = lead.nextFollowUpDate && !isNaN(new Date(lead.nextFollowUpDate).getTime())
                            ? format(new Date(lead.nextFollowUpDate), 'PPP')
                            : (lastFollowUp ? lastFollowUp.nextFollowUp : 'N/A');

                          return (
                            <TableRow key={lead.leadId} className="hover:bg-muted/30 transition-colors">
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-mono font-medium">{lead.leadId}</TableCell>
                              <TableCell>{lead.creationDate ? format(new Date(lead.creationDate), 'PPP') : 'N/A'}</TableCell>
                              <TableCell>
                                <ExpandableCell 
                                  content={getDisplayModule(lead.selectedModule || "", modules)} 
                                  title="Selected Modules" 
                                />
                              </TableCell>
                              <TableCell className="font-semibold">{lead.company}</TableCell>
                              <TableCell>{lead.contactPerson}</TableCell>
                              <TableCell>{lead.contactNumber}</TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>
                                <ExpandableCell 
                                  content={lead.address} 
                                  title="Address" 
                                />
                              </TableCell>
                              <TableCell>{lead.district}</TableCell>
                              <TableCell>{lead.state}</TableCell>
                              <TableCell>{lead.reference}</TableCell>
                              <TableCell>{lead.executive || 'N/A'}</TableCell>
                              <TableCell>{lead.manager || 'N/A'}</TableCell>
                              <TableCell>
                                {lastFollowUp && lastFollowUp.date ? format(new Date(lastFollowUp.date), 'PPP') : 'N/A'}
                              </TableCell>
                              <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                              <TableCell>{nextFollowupDate}</TableCell>
                              <TableCell>
                                <ExpandableCell 
                                  content={lastFollowUp ? lastFollowUp.remarks : 'N/A'} 
                                  title="Last Follow-up Remarks" 
                                />
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-primary">{lead.status}</span>
                              </TableCell>
                              <TableCell>
                                <ExpandableCell 
                                  content={lead.initialRemarks || 'N/A'} 
                                  title="Status Remarks" 
                                />
                              </TableCell>
                              <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={21} className="h-24 text-center">
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
