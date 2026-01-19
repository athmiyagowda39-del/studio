
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/context/users-context';
import { Label } from '@/components/ui/label';

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
    const { users } = useUsers();
    const router = useRouter();
    const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [selectedPeriod, setSelectedPeriod] = useState<string>((new Date().getMonth() + 1).toString());
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
    const [selectedExecutive, setSelectedExecutive] = useState<string>('all');
    const [executives, setExecutives] = useState<string[]>([]);
    
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        const executiveUsers = users
          .filter(user => user.role === 'Executive')
          .map(user => user.username);
        setExecutives(executiveUsers);
    
        if (user?.role === 'Executive') {
          setSelectedExecutive(user.username);
        } else {
          setSelectedExecutive('all');
        }
    }, [users, user]);


    useEffect(() => {
        if (isAuthenticated) {
            const leads = getLeadsFromLocalStorage();
            setAllLeads(leads);
            setIsDataLoading(false);
        }
    }, [isAuthenticated]);

    const filteredLeads = useMemo(() => {
        if (!allLeads || !user) return [];

        // For Executives, they always see leads assigned to them.
        if (user.role === 'Executive') {
            return allLeads.filter(lead => lead.executive === user.username);
        }

        // For Admins/Sub Admins, their view depends on the executive filter.
        if (user.role === 'Admin' || user.role === 'Sub Admin') {
            if (selectedExecutive !== 'all') {
                // If a specific executive is selected, show their leads.
                return allLeads.filter(lead => lead.executive === selectedExecutive);
            } else {
                // If 'all' is selected (default), show leads created by the logged-in admin.
                return allLeads.filter(lead => lead.givenBy === user.username);
            }
        }
        
        // Fallback for any other roles or if user is null
        return [];
    }, [allLeads, user, selectedExecutive]);


    const totalLeadsToday = useMemo(() => {
        if (!filteredLeads) return 0;
        const todayStart = startOfDay(new Date()).getTime();
        const todayEnd = endOfDay(new Date()).getTime();
        return filteredLeads.filter(lead => 
            lead.creationDate >= todayStart && lead.creationDate <= todayEnd
        ).length;
    }, [filteredLeads]);

    const performanceData = useMemo(() => {
      let leads = filteredLeads;

      if (selectedState !== 'all') {
        leads = leads.filter(lead => lead.state === selectedState);
      }
      if (selectedDistrict !== 'all') {
        leads = leads.filter(lead => lead.district === selectedDistrict);
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
    }, [filteredLeads, selectedPeriod, selectedState, selectedDistrict]);
  
    if (isLoading || isDataLoading || !isAuthenticated) {
        return null; // or a loading skeleton
    }

    return (
        <AppContent>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight font-headline">
                           WELCOME! {user?.username.toUpperCase()}
                        </h1>
                        <p className="text-muted-foreground">
                            Here is your lead generation overview for today.
                        </p>
                    </div>
                </div>


                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total number of leads generated today!!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-primary">{totalLeadsToday}</p>
                            <CardDescription>
                                Total number of Leads: {filteredLeads?.length || 0}
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
                                selectedDistrict={selectedDistrict}
                                setSelectedDistrict={setSelectedDistrict}
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
