
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { useState, useMemo, useEffect } from 'react';
import { startOfDay, endOfDay, getDay, format as formatDate, eachDayOfInterval, getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import AppContent from '@/components/layout/app-content';
import LeadPerformanceFilters from '@/components/dashboard/lead-performance-filters';
import dynamic from 'next/dynamic';

const LeadPerformanceChart = dynamic(
  () => import('@/components/dashboard/lead-performance-chart'),
  { ssr: false, loading: () => <div className="h-[300px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};

export default function DashboardPage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [selectedPeriod, setSelectedPeriod] = useState<string>((new Date().getMonth() + 1).toString());
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);


    useEffect(() => {
        if (isAuthenticated) {
            let leads = getLeadsFromLocalStorage();
            if (user?.role === 'Executive') {
                leads = leads.filter(lead => lead.executive === user.username);
            }
            setAllLeads(leads);
            setIsDataLoading(false);
        }
    }, [isAuthenticated, user]);

    const totalLeadsToday = useMemo(() => {
        if (!allLeads) return 0;
        const todayStart = startOfDay(new Date()).getTime();
        const todayEnd = endOfDay(new Date()).getTime();
        return allLeads.filter(lead => 
            lead.creationDate >= todayStart && lead.creationDate <= todayEnd
        ).length;
    }, [allLeads]);

    const performanceData = useMemo(() => {
      let leads = allLeads;

      if (selectedState !== 'all') {
        leads = leads.filter(lead => lead.state === selectedState);
      }
      if (selectedCity !== 'all') {
        leads = leads.filter(lead => lead.district === selectedCity);
      }

      const year = getYear(new Date());
      const month = parseInt(selectedPeriod, 10) - 1;
      const startDate = startOfMonth(new Date(year, month));
      const endDate = endOfMonth(new Date(year, month));
      
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const dailyLeads: { [key: string]: { day: string; leads: number } } = {};
      days.forEach(date => {
          const dayOfMonth = formatDate(date, 'd');
          dailyLeads[dayOfMonth] = { day: dayOfMonth, leads: 0 };
      });
      
      const monthlyLeads = leads.filter(lead => {
        const leadDate = new Date(lead.creationDate);
        return getMonth(leadDate) === month && getYear(leadDate) === year;
      });

      monthlyLeads.forEach((lead) => {
        const leadDate = new Date(lead.creationDate);
        const dayOfMonth = formatDate(leadDate, 'd');
        if (dailyLeads[dayOfMonth]) {
          dailyLeads[dayOfMonth].leads += 1;
        }
      });
    
      return Object.values(dailyLeads);
    }, [allLeads, selectedPeriod, selectedState, selectedCity]);
  
    if (isLoading || isDataLoading || !isAuthenticated) {
        return null; // or a loading skeleton
    }

    return (
        <AppContent>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight font-headline">
                       WELCOME! {user?.username.toUpperCase()}
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
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <CardTitle className="text-center">Lead volume Analysis</CardTitle>
                             <LeadPerformanceFilters
                                allLeads={allLeads}
                                selectedPeriod={selectedPeriod}
                                setSelectedPeriod={setSelectedPeriod}
                                selectedState={selectedState}
                                setSelectedState={setSelectedState}
                                selectedCity={selectedCity}
                                setSelectedCity={setSelectedCity}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                      <LeadPerformanceChart performanceData={performanceData} xAxisLabel="Date" />
                    </CardContent>
                </Card>
            </div>
        </AppContent>
    );
}
