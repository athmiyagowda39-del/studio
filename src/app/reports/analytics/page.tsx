'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const LeadStatusChart = dynamic(
  () => import('@/components/reports/lead-status-chart'),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><p>Loading Analytics...</p></div> }
);

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading, leads: allLeads } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

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

  const statusData = useMemo(() => {
    if (!visibleLeads.length) return [];
    const counts: Record<string, number> = {};
    visibleLeads.forEach(lead => {
      const status = lead.status || 'N/A';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [visibleLeads]);

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
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* STATUS OVERVIEW */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leads by Status</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center min-h-[400px]">
                  {isClient && statusData.length > 0 ? (
                    <LeadStatusChart data={statusData} />
                  ) : (
                    <div className="text-muted-foreground">No data available to display chart.</div>
                  )}
                </CardContent>
              </Card>

              {/* STATS SUMMARY */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-primary/5 rounded-xl border-2 border-primary/10 flex flex-col items-center">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Leads Assigned</span>
                      <span className="text-5xl font-extrabold text-primary mt-2">{visibleLeads.length}</span>
                    </div>
                    
                    <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Follow-ups Logged</span>
                      <span className="text-4xl font-bold mt-2">
                        {visibleLeads.reduce((acc, lead) => acc + (lead.followUps?.length || 0), 0)}
                      </span>
                    </div>

                    <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Engagement Rate</span>
                      <span className="text-4xl font-bold mt-2">
                        {visibleLeads.length > 0 
                          ? Math.round((visibleLeads.filter(l => (l.followUps?.length || 0) > 0).length / visibleLeads.length) * 100) 
                          : 0}%
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">(Leads with at least 1 follow-up)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
