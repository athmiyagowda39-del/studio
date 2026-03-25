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
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { getDisplayModule } from '@/lib/modules';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronRight, Calendar, BarChart3, Flame, Sun, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const LeadSourceChart = dynamic(
  () => import('@/components/reports/lead-source-chart'),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center"><p>Loading Source Analytics...</p></div> }
);

const GeographyPerformanceChart = dynamic(
  () => import('@/components/reports/geography-performance-chart'),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center"><p>Loading Geography Data...</p></div> }
);

const PredictedLeadClosures = dynamic(
  () => import('@/components/reports/predicted-lead-closures'),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center"><p>Loading Forecast...</p></div> }
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

type MetricType = 'leads' | 'deals' | 'won' | 'totalLeads' | 'totalDeals' | 'totalWon' | 'hot' | 'warm' | 'cold' | string | null;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

// Temperature Mapping Constants
const HOT_STATUSES = ["Demo Given", "Order closed", "Proposal Sent", "Quote Sent", "Pursuing to Purchase"];
const WARM_STATUSES = ["Interested", "Attended", "Existing Users"];
const COLD_STATUSES = ["Not interested", "Do not contact", "Not viewed", "Fake", "Unattended", "Drop", "Lost", "Initial"];

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading, leads: allLeads, modules } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Date Filter State
  const [filterDate, setFilterDate] = useState(new Date());

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

  // Total Lifetime Stats for the user
  const totalStats = useMemo(() => {
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

  // Filter leads based on selected month and year
  const filteredLeads = useMemo(() => {
    const targetMonth = getMonth(filterDate);
    const targetYear = getYear(filterDate);

    return visibleLeads.filter(lead => {
      if (!lead.creationDate) return false;
      const d = new Date(lead.creationDate);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
  }, [visibleLeads, filterDate]);

  const stats = useMemo(() => {
    if (!visibleLeads.length) return { created: 0, deals: 0, won: 0, hot: 0, warm: 0, cold: 0 };

    const dealsCreatedStatuses = ["Demo Given", "Proposal Sent", "Quote Sent", "Pursuing to Purchase"];
    
    const deals = visibleLeads.filter(l => dealsCreatedStatuses.includes(l.status || ""));
    const won = visibleLeads.filter(l => l.status === "Order closed");

    // Temperature Logic (Lifetime)
    const hot = visibleLeads.filter(l => HOT_STATUSES.includes(l.status || ""));
    const warm = visibleLeads.filter(l => WARM_STATUSES.includes(l.status || ""));
    const cold = visibleLeads.filter(l => COLD_STATUSES.includes(l.status || ""));

    return {
      created: visibleLeads.length,
      deals: deals.length,
      won: won.length,
      hot: hot.length,
      warm: warm.length,
      cold: cold.length
    };
  }, [visibleLeads]);

  const sourceData = useMemo(() => {
    if (!filteredLeads.length) return [];
    
    const counts = new Map<string, { name: string; value: number }>();
    
    filteredLeads.forEach(lead => {
      let rawName = (lead.reference || 'Other').trim();
      if (!rawName) rawName = 'Other';

      let normalized = rawName
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
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
  }, [filteredLeads]);

  const metricLeads = useMemo(() => {
    if (!selectedMetric) return [];

    const dealsCreatedStatuses = ["Demo Given", "Proposal Sent", "Quote Sent", "Pursuing to Purchase"];

    // Handle Total (Lifetime) Metrics
    if (selectedMetric === 'totalLeads') return visibleLeads;
    if (selectedMetric === 'totalDeals') return visibleLeads.filter(l => dealsCreatedStatuses.includes(l.status || ""));
    if (selectedMetric === 'totalWon') return visibleLeads.filter(l => l.status === "Order closed");

    // Handle Monthly Filtered Metrics
    if (selectedMetric === 'leads') return filteredLeads;
    if (selectedMetric === 'deals') return filteredLeads.filter(l => dealsCreatedStatuses.includes(l.status || ""));
    if (selectedMetric === 'won') return filteredLeads.filter(l => l.status === "Order closed");
    
    // Temperature Drill-down (Lifetime)
    if (selectedMetric === 'hot') return visibleLeads.filter(l => HOT_STATUSES.includes(l.status || ""));
    if (selectedMetric === 'warm') return visibleLeads.filter(l => WARM_STATUSES.includes(l.status || ""));
    if (selectedMetric === 'cold') return visibleLeads.filter(l => COLD_STATUSES.includes(l.status || ""));
    
    // Check if it matches a Lead Source (Reference)
    const isSource = sourceData.some(s => s.name === selectedMetric);
    if (isSource) {
      return filteredLeads.filter(l => {
        let rawName = (l.reference || 'Other').trim();
        if (!rawName) rawName = 'Other';
        let normalized = rawName
          .toLowerCase()
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        if (normalized === 'Refferal') normalized = 'Referral';
        return normalized === selectedMetric;
      });
    }

    // Check if it's a specific region (State) - Geography is treated as Lifetime
    const isState = visibleLeads.some(l => (l.state || 'Other').trim().toLowerCase() === (selectedMetric as string).toLowerCase());
    if (isState) {
      return visibleLeads.filter(l => {
        const normalizedState = (l.state || 'Other').trim().toLowerCase();
        const normalizedSelected = (selectedMetric as string).trim().toLowerCase();
        return normalizedState === normalizedSelected;
      });
    }

    return [];
  }, [selectedMetric, filteredLeads, visibleLeads, sourceData]);

  const temperatureChartData = useMemo(() => {
    return [
      { name: 'Hot', value: stats.hot, fill: '#ef4444' },
      { name: 'Warm', value: stats.warm, fill: '#3b82f6' },
      { name: 'Cold', value: stats.cold, fill: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [stats]);

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

  const handleMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    setFilterDate(prev => setMonth(prev, monthIndex));
  };

  const handleYearChange = (yearStr: string) => {
    setFilterDate(prev => setYear(prev, parseInt(yearStr, 10)));
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const totalTemp = stats.hot + stats.warm + stats.cold;
  const getPct = (val: number) => totalTemp > 0 ? ((val / totalTemp) * 100).toFixed(1) : "0.0";

  const isLifetimeMetric = ['totalLeads', 'totalDeals', 'totalWon', 'hot', 'warm', 'cold'].includes(selectedMetric as string);
  const isSourceMetric = sourceData.some(s => s.name === selectedMetric);
  const isRegionMetric = !isLifetimeMetric && !isSourceMetric && selectedMetric !== null && visibleLeads.some(l => (l.state || 'Other').trim().toLowerCase() === (selectedMetric as string).toLowerCase());

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary uppercase">Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            
            {/* TOP ROW: GLOBAL DATE FILTER */}
            <div className="flex justify-end mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 px-4 gap-2 font-bold border-2 border-primary/20 hover:border-primary/50 transition-all">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(filterDate, 'MMMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 space-y-4" align="end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Select Month</label>
                    <Select value={months[getMonth(filterDate)]} onValueChange={handleMonthChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Select Year</label>
                    <Select value={getYear(filterDate).toString()} onValueChange={handleYearChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* LEFT COLUMN: Performance Overview */}
              <div className="flex flex-col gap-8">
                
                {/* PERFORMANCE OVERVIEW CARD - Lifetime Totals */}
                <Card className="border shadow-sm overflow-hidden h-fit">
                  <CardHeader className="border-b bg-muted/5 py-4">
                    <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">Performance Overview (Lifetime)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {/* LEADS CREATED (TOTAL) */}
                      <div 
                        className={cn(
                          "group flex items-center justify-between p-8 border-b cursor-pointer transition-colors hover:bg-muted/30 relative",
                          selectedMetric === 'totalLeads' && "bg-primary/5"
                        )}
                        onClick={() => handleMetricClick('totalLeads')}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-[5px] h-8 bg-blue-600 rounded-full" />
                          <span className="font-bold text-[11px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-blue-600 transition-colors">Leads Created</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-bold tracking-tighter text-foreground">{totalStats.created}</span>
                          <ChevronRight className={cn("h-5 w-5 text-muted-foreground/40 transition-transform", selectedMetric === 'totalLeads' && "rotate-90 text-blue-600")} />
                        </div>
                      </div>

                      {/* DEALS CREATED (TOTAL) */}
                      <div 
                        className={cn(
                          "group flex items-center justify-between p-8 border-b cursor-pointer transition-colors hover:bg-muted/30 relative",
                          selectedMetric === 'totalDeals' && "bg-primary/5"
                        )}
                        onClick={() => handleMetricClick('totalDeals')}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-[5px] h-8 bg-blue-50 rounded-full" />
                          <span className="font-bold text-[11px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-blue-50 transition-colors">Deals Created</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-bold tracking-tighter text-foreground">{totalStats.deals}</span>
                          <ChevronRight className={cn("h-5 w-5 text-muted-foreground/40 transition-transform", selectedMetric === 'totalDeals' && "rotate-90 text-blue-500")} />
                        </div>
                      </div>

                      {/* DEALS WON (TOTAL) */}
                      <div 
                        className={cn(
                          "group flex items-center justify-between p-8 cursor-pointer transition-colors hover:bg-muted/30 relative",
                          selectedMetric === 'totalWon' && "bg-primary/5"
                        )}
                        onClick={() => handleMetricClick('totalWon')}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-[5px] h-8 bg-emerald-500 rounded-full" />
                          <span className="font-bold text-[11px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-emerald-500 transition-colors">Deals Won</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-bold tracking-tighter text-foreground">{totalStats.won}</span>
                          <ChevronRight className={cn("h-5 w-5 text-muted-foreground/40 transition-transform", selectedMetric === 'totalWon' && "rotate-90 text-emerald-500")} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* LEAD TEMPERATURE CARD */}
                <Card className="border-2 shadow-md overflow-hidden h-fit">
                  <CardHeader className="border-b bg-muted/10 py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Lead Temperature (Lifetime)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => handleMetricClick('hot')}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group relative",
                          selectedMetric === 'hot' 
                            ? "border-red-500 bg-red-50 shadow-md scale-105 z-10" 
                            : "border-red-100 bg-red-50/30 hover:border-red-300"
                        )}
                      >
                        <Flame className="h-6 w-6 mb-2 text-red-500" />
                        <span className="text-2xl font-black text-foreground mb-1">{stats.hot}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">HOT</span>
                        <span className="text-[10px] font-medium text-muted-foreground mt-1">{getPct(stats.hot)}%</span>
                      </button>

                      <button 
                        onClick={() => handleMetricClick('warm')}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group relative",
                          selectedMetric === 'warm' 
                            ? "border-blue-500 bg-blue-50 shadow-md scale-105 z-10" 
                            : "border-blue-100 bg-blue-50/30 hover:border-blue-300"
                        )}
                      >
                        <Snowflake className="h-6 w-6 mb-2 text-blue-500" />
                        <span className="text-2xl font-black text-foreground mb-1">{stats.warm}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">WARM</span>
                        <span className="text-[10px] font-medium text-muted-foreground mt-1">{getPct(stats.warm)}%</span>
                      </button>

                      <button 
                        onClick={() => handleMetricClick('cold')}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group relative",
                          selectedMetric === 'cold' 
                            ? "border-amber-500 bg-amber-50 shadow-md scale-105 z-10" 
                            : "border-amber-100 bg-amber-50/30 hover:border-amber-300"
                        )}
                      >
                        <Sun className="h-6 w-6 mb-2 text-amber-500" />
                        <span className="text-2xl font-black text-foreground mb-1">{stats.cold}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">COLD</span>
                        <span className="text-[10px] font-medium text-muted-foreground mt-1">{getPct(stats.cold)}%</span>
                      </button>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={temperatureChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                              stroke="none"
                            >
                              {temperatureChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} className="outline-none" />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value: number, name: string) => [`${value} leads (${getPct(value)}%)`, name]}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SOURCE PIE CHART */}
                <Card className="border-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/10 py-4">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Leads Distribution by Source</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex items-center justify-center min-h-[400px]">
                    {isClient && sourceData.length > 0 ? (
                      <LeadSourceChart data={sourceData} onSourceClick={(sourceName) => handleMetricClick(sourceName)} />
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-muted-foreground flex-col gap-2">
                        <BarChart3 className="h-12 w-12 opacity-20" />
                        <p className="font-medium text-sm">No data available for {format(filterDate, 'MMMM yyyy')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* RIGHT COLUMN: Geography Dashboard & Sales Forecast */}
              <div className="flex flex-col gap-8">
                {isClient && (
                  <GeographyPerformanceChart 
                    leads={visibleLeads} 
                    onRegionClick={(stateName) => handleMetricClick(stateName)} 
                  />
                )}
                
                {isClient && <PredictedLeadClosures leads={visibleLeads} />}
              </div>

            </div>

            {/* Drill Down Table */}
            {selectedMetric && (
              <Card ref={detailsRef} className="border-2 border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base uppercase">
                    Details: <span className={cn(
                      "font-black",
                      (selectedMetric === 'hot' || selectedMetric === 'totalLeads') && "text-red-600",
                      selectedMetric === 'warm' && "text-blue-600",
                      selectedMetric === 'cold' && "text-amber-600",
                      (selectedMetric === 'leads' || selectedMetric === 'deals' || selectedMetric === 'won' || selectedMetric === 'totalDeals' || selectedMetric === 'totalWon') && "text-primary",
                      isSourceMetric && "text-primary",
                      isRegionMetric && "text-primary",
                      (!isLifetimeMetric && !isSourceMetric && !isRegionMetric) && "text-primary"
                    )}>
                      {selectedMetric === 'totalLeads' ? 'Total Leads Created (Lifetime)' : 
                       selectedMetric === 'totalDeals' ? 'Total Deals Created (Lifetime)' : 
                       selectedMetric === 'totalWon' ? 'Total Deals Won (Lifetime)' :
                       selectedMetric === 'leads' ? 'Leads Created' : 
                       selectedMetric === 'deals' ? 'Deals Created' : 
                       selectedMetric === 'won' ? 'Deals Won' : 
                       selectedMetric === 'hot' ? 'Hot Leads (Lifetime)' : 
                       selectedMetric === 'warm' ? 'Warm Leads (Lifetime)' : 
                       selectedMetric === 'cold' ? 'Cold Leads (Lifetime)' : 
                       isSourceMetric ? `Source: ${selectedMetric.toUpperCase()}` :
                       isRegionMetric ? `Region: ${selectedMetric.toUpperCase()} (Total Records)` :
                       `${selectedMetric.toUpperCase()}`}
                    </span> ({metricLeads.length} Records {isLifetimeMetric || isRegionMetric ? 'Total' : `in ${format(filterDate, 'MMM yyyy')}`})
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
