
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { getDisplayModule } from '@/lib/modules';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronRight, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const LeadSourceChart = dynamic(
  () => import('@/components/reports/lead-source-chart'),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center"><p>Loading Source Analytics...</p></div> }
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

type MetricType = 'leads' | 'deals' | 'won' | string | null;

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading, leads: allLeads, modules } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
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

  const stats = useMemo(() => {
    if (!visibleLeads.length) return { created: 0, deals: 0, won: 0 };

    const dealsCreatedStatuses = ["Demo Given", "Proposal Sent", "Quote Sent", "Pursuing to Purchase"];
    
    const deals = visibleLeads.filter(l => dealsCreatedStatuses.includes(l.status || ""));
    const won = visibleLeads.filter(l => l.status === "Order closed");

    return {
      created: visibleLeads.length,
      deals: deals.length,
      won: won.length
    };
  }, [visibleLeads]);

  const statusRanking = useMemo(() => {
    if (!visibleLeads.length) return [];
    
    const counts = new Map<string, number>();
    visibleLeads.forEach(lead => {
      const status = lead.status || 'Not viewed';
      counts.set(status, (counts.get(status) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [visibleLeads]);

  const metricLeads = useMemo(() => {
    if (!selectedMetric || !visibleLeads.length) return [];

    const dealsCreatedStatuses = ["Demo Given", "Proposal Sent", "Quote Sent", "Pursuing to Purchase"];

    if (selectedMetric === 'leads') return visibleLeads;
    if (selectedMetric === 'deals') return visibleLeads.filter(l => dealsCreatedStatuses.includes(l.status || ""));
    if (selectedMetric === 'won') return visibleLeads.filter(l => l.status === "Order closed");
    
    return visibleLeads.filter(l => l.status === selectedMetric);
  }, [selectedMetric, visibleLeads]);

  const sourceData = useMemo(() => {
    if (!visibleLeads.length) return [];
    
    const counts = new Map<string, { name: string; value: number }>();
    
    visibleLeads.forEach(lead => {
      let rawName = (lead.reference || 'Other').trim();
      if (!rawName) rawName = 'Other';

      // Standardize to Title Case for initial grouping but chart will display UPPER CASE
      let normalized = rawName
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Fix specific misspellings
      if (normalized === 'Refferal') normalized = 'Referral';

      const existing = counts.get(normalized);
      if (existing) {
        existing.value += 1;
      } else {
        counts.set(normalized, { name: normalized, value: 1 });
      }
    });

    return Array.from(counts.values())
      .sort((a, b) => b.value - a.value);
  }, [visibleLeads]);

  const handleMetricClick = (metric: MetricType) => {
    if (selectedMetric === metric) {
      setSelectedMetric(null);
    } else {
      setSelectedMetric(metric);
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
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary uppercase">Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pipeline Overview */}
              <div className="space-y-6">
                <Card className="border-2 shadow-sm overflow-hidden h-fit">
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Performance Overview</CardTitle>
                    <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(), 'MMMM yyyy')}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      <div 
                        className={cn(
                          "group flex items-center justify-between p-6 border-b cursor-pointer transition-colors hover:bg-muted/30 relative",
                          selectedMetric === 'leads' && "bg-primary/5"
                        )}
                        onClick={() => handleMetricClick('leads')}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-8 bg-primary rounded-full" />
                          <span className="font-bold text-sm text-foreground/80 group-hover:text-primary transition-colors">LEADS CREATED</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-foreground">{stats.created}</span>
                          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", selectedMetric === 'leads' && "rotate-90 text-primary")} />
                        </div>
                      </div>

                      <div 
                        className={cn(
                          "group flex items-center justify-between p-6 border-b cursor-pointer transition-colors hover:bg-muted/30 relative",
                          selectedMetric === 'deals' && "bg-primary/5"
                        )}
                        onClick={() => handleMetricClick('deals')}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-8 bg-blue-500 rounded-full" />
                          <span className="font-bold text-sm text-foreground/80 group-hover:text-blue-500 transition-colors">DEALS CREATED</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-foreground">{stats.deals}</span>
                          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", selectedMetric === 'deals' && "rotate-90 text-blue-500")} />
                        </div>
                      </div>

                      <div 
                        className={cn(
                          "group flex items-center justify-between p-6 cursor-pointer transition-colors hover:bg-muted/30 relative",
                          selectedMetric === 'won' && "bg-primary/5"
                        )}
                        onClick={() => handleMetricClick('won')}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                          <span className="font-bold text-sm text-foreground/80 group-hover:text-emerald-500 transition-colors">DEALS WON</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-foreground">{stats.won}</span>
                          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", selectedMetric === 'won' && "rotate-90 text-emerald-500")} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-sm overflow-hidden h-fit">
                  <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/10 py-4">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Lead Status Ranking</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y">
                        {statusRanking.map((status, index) => (
                          <div 
                            key={status.name}
                            className={cn(
                              "group flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-all",
                              selectedMetric === status.name && "bg-primary/5"
                            )}
                            onClick={() => handleMetricClick(status.name)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <span className="text-xs font-bold text-muted-foreground min-w-[20px]">{index + 1}.</span>
                              <div className="flex flex-col flex-1 gap-1">
                                <span className="text-xs font-bold uppercase tracking-wide group-hover:text-primary transition-colors truncate">
                                  {status.name}
                                </span>
                                <div className="w-full bg-muted/20 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary/80 group-hover:bg-primary transition-all duration-1000" 
                                    style={{ width: `${(status.value / stats.created) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                              <span className="text-base font-black text-foreground">{status.value}</span>
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 border px-2 py-0.5 rounded-sm min-w-[45px] text-center">
                                {((status.value / stats.created) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Source Distribution */}
              <Card className="border-2 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Leads by Source</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex items-center justify-center">
                  {isClient && sourceData.length > 0 ? (
                    <LeadSourceChart data={sourceData} />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      No source data available to display.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Drill Down Table */}
            {selectedMetric && (
              <Card ref={detailsRef} className="border-2 border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base uppercase">
                    Details: <span className="text-primary font-black">
                      {selectedMetric === 'leads' ? 'Leads Created' : selectedMetric === 'deals' ? 'Deals Created' : selectedMetric === 'won' ? 'Deals Won' : `Status: ${selectedMetric}`}
                    </span> ({metricLeads.length} Records)
                  </CardTitle>
                  <button 
                    onClick={() => setSelectedMetric(null)} 
                    className="text-[10px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors border bg-background px-2 py-1 rounded shadow-sm"
                  >
                    Close Table
                  </button>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <Table className="min-w-[2500px]">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Sl No</TableHead>
                          <TableHead>Lead Id</TableHead>
                          <TableHead>Lead Date</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Emailid</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Executive</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Next followup Date</TableHead>
                          <TableHead>Last Followup Remarks</TableHead>
                          <TableHead>Lead Status</TableHead>
                          <TableHead>Status Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metricLeads.length > 0 ? (
                          metricLeads.map((lead, index) => {
                            const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                            const nextFollowupDate = lead.nextFollowUpDate && !isNaN(new Date(lead.nextFollowUpDate).getTime())
                              ? format(new Date(lead.nextFollowUpDate), 'PPP')
                              : (lastFollowUp ? lastFollowUp.nextFollowUp : 'N/A');

                            return (
                              <TableRow key={`${lead.leadId}-${index}`} className="hover:bg-muted/30 transition-colors">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-mono font-medium">{lead.leadId}</TableCell>
                                <TableCell>{lead.creationDate ? format(new Date(lead.creationDate), 'PPP') : 'N/A'}</TableCell>
                                <TableCell className="font-bold">{lead.company}</TableCell>
                                <TableCell>{lead.contactPerson}</TableCell>
                                <TableCell>{lead.contactNumber}</TableCell>
                                <TableCell>{lead.email}</TableCell>
                                <TableCell>
                                  <ExpandableCell content={lead.address} title="Address" />
                                </TableCell>
                                <TableCell>{lead.reference}</TableCell>
                                <TableCell>{lead.executive || 'N/A'}</TableCell>
                                <TableCell>{lead.manager || 'N/A'}</TableCell>
                                <TableCell>{nextFollowupDate}</TableCell>
                                <TableCell>
                                  <ExpandableCell content={lastFollowUp ? lastFollowUp.remarks : 'N/A'} title="Follow-up Remarks" />
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-primary">{lead.status}</span>
                                </TableCell>
                                <TableCell>
                                  <ExpandableCell content={lead.initialRemarks || 'N/A'} title="Initial Remarks" />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={15} className="h-24 text-center">
                              No records found for this metric.
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
      </div>
    </AppContent>
  );
}
