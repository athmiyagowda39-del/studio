'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import LeadPerformanceChart from '@/components/dashboard/lead-performance-chart';
import { useState, useMemo, useEffect } from 'react';
import { startOfDay, endOfDay, subDays, format as formatDate, eachDayOfInterval } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import AppContent from '../app-content';

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};

export default function DashboardPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
        router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);


  useEffect(() => {
    if (isAuthenticated) {
        const leads = getLeadsFromLocalStorage();
        setAllLeads(leads);
        setIsDataLoading(false);
    }
  }, [isAuthenticated]);

  const totalLeadsToday = useMemo(() => {
    if (!allLeads) return 0;
    const todayStart = startOfDay(new Date()).getTime();
    const todayEnd = endOfDay(new Date()).getTime();
    return allLeads.filter(lead => 
      lead.creationDate >= todayStart && lead.creationDate <= todayEnd
    ).length;
  }, [allLeads]);

  const performanceData = useMemo(() => {
    if (!allLeads) return [];

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });

    // Initialize data for each of the last 30 days
    const dailyLeads: { [key: string]: { day: string; leads: number } } = {};
    days.forEach(date => {
        const formattedDate = formatDate(date, 'MMM d');
        dailyLeads[formattedDate] = { day: formattedDate, leads: 0 };
    });

    // Filter leads from the last 30 days
    const recentLeads = allLeads.filter(
      (lead) => lead.creationDate >= thirtyDaysAgo.getTime()
    );

    // Aggregate leads by day
    recentLeads.forEach((lead) => {
      const leadDate = new Date(lead.creationDate);
      const formattedDate = formatDate(leadDate, 'MMM d');
      if (dailyLeads[formattedDate]) {
        dailyLeads[formattedDate].leads += 1;
      }
    });
  
    return Object.values(dailyLeads);
  }, [allLeads]);
  
  if (isLoading || isDataLoading || !isAuthenticated) {
    return null; // or a loading skeleton
  }

  return (
    <AppContent>
        <div className="flex flex-col gap-6">
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight font-headline">
            WELCOME!
            </h1>
            <p className="text-muted-foreground">
            Here is your lead generation overview for today.
            </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
            <Card>
            <CardHeader>
                <CardTitle>Total number of leads generated today!!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold text-primary">{totalLeadsToday}</p>
                <CardDescription>
                Total number of Leads: {allLeads?.length || 0}
                </CardDescription>
            </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
            <CardTitle className="text-center">Lead volume Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadPerformanceChart performanceData={performanceData} xAxisLabel="Date" />
            </CardContent>
        </Card>
        </div>
    </AppContent>
  );
}
