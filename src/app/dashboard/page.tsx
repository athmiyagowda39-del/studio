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
import { startOfDay, endOfDay, getYear, format as formatDate, eachDayOfInterval, getMonth, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import AppContent from '@/components/layout/app-content';
import LeadPerformanceFilters from '@/components/dashboard/lead-performance-filters';
import dynamic from 'next/dynamic';

const LeadPerformanceChart = dynamic(
  () => import('@/components/dashboard/lead-performance-chart'),
  { ssr: false, loading: () => <div className="h-[300px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

export default function DashboardPage() {
    const { isAuthenticated, isLoading, user, leads: allLeads, users } = useApp();
    const router = useRouter();

    const [selectedPeriod, setSelectedPeriod] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
    const [selectedExecutive, setSelectedExecutive] = useState<string>('all');
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (user?.role === 'Executive') {
          setSelectedExecutive(user.username);
        } else {
          setSelectedExecutive('all');
        }
    }, [users, user]);

    const filteredLeads = useMemo(() => {
        if (!allLeads || !user) return [];

        if (user.role === 'Manager' || user.role === 'Admin' || user.role === 'Super Admin') {
            if (selectedExecutive !== 'all') {
                return allLeads.filter(lead => lead.executive === selectedExecutive);
            }
            return allLeads;
        }

        if (user.role === 'Executive') {
            return allLeads.filter(lead => lead.executive === user.username);
        }
        
        return [];
    }, [allLeads, user, selectedExecutive]);


    const totalLeadsToday = useMemo(() => {
        if (!isClient || !filteredLeads) return 0;
        const now = new Date();
        const todayStart = startOfDay(now).getTime();
        const todayEnd = endOfDay(now).getTime();
        return filteredLeads.filter(lead => {
            if (!lead.creationDate) return false;
            const leadTime = new Date(lead.creationDate).getTime();
            return leadTime >= todayStart && leadTime <= todayEnd;
        }).length;
    }, [filteredLeads, isClient]);

    const performanceData = useMemo(() => {
      if (!isClient) return [];
      
      let leads = filteredLeads;

      if (selectedState !== 'all') {
        leads = leads.filter(lead => lead.state === selectedState);
      }
      if (selectedDistrict !== 'all') {
        leads = leads.filter(lead => lead.district === selectedDistrict);
      }

      const now = new Date();
      const year = getYear(now);
      const isAllYearView = selectedPeriod.includes('all');

      if (isAllYearView) {
        const monthlyData = eachMonthOfInterval({
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 1),
        }).map(monthDate => ({
          month: formatDate(monthDate, 'MMM'),
          leads: 0,
        }));

        const relevantLeads = leads.filter(lead => lead.creationDate && getYear(new Date(lead.creationDate)) === year);

        relevantLeads.forEach(lead => {
          if (!lead.creationDate) return;
          const monthIndex = getMonth(new Date(lead.creationDate));
          if (monthlyData[monthIndex]) {
            monthlyData[monthIndex].leads++;
          }
        });
        
        return monthlyData;
      }

      const isSingleMonthView = selectedPeriod.length === 1 || selectedPeriod.length === 0;

      let monthIndexesToShow: number[];
      if (selectedPeriod.length > 0) {
        monthIndexesToShow = selectedPeriod.map(m => parseInt(m, 10) - 1);
      } else {
        monthIndexesToShow = [getMonth(now)];
      }

      if (isSingleMonthView) {
        const monthIndex = monthIndexesToShow[0];
        const monthDate = new Date(year, monthIndex);
        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate)
        });

        const dailyData = daysInMonth.map(day => ({
            day: formatDate(day, 'dd'),
            leads: 0,
        }));

        const relevantLeads = leads.filter(lead => {
            if (!lead.creationDate) return false;
            const leadDate = new Date(lead.creationDate);
            return getYear(leadDate) === year && getMonth(leadDate) === monthIndex;
        });

        relevantLeads.forEach(lead => {
            if (!lead.creationDate) return;
            const dayOfMonth = new Date(lead.creationDate).getDate() - 1;
            if (dailyData[dayOfMonth]) {
                dailyData[dayOfMonth].leads++;
            }
        });
        
        return dailyData;
      } else { 
        const dateRanges = monthIndexesToShow.map(monthIndex => {
            const monthDate = new Date(year, monthIndex);
            return {
                start: startOfMonth(monthDate),
                end: endOfMonth(monthDate)
            };
        });

        const allDays: Date[] = dateRanges.flatMap(range => eachDayOfInterval(range)).sort((a, b) => a.getTime() - b.getTime());
        
        const dailyLeads: { [key: string]: { date: string; leads: number } } = {};
        
        allDays.forEach(date => {
            const formattedDate = formatDate(date, 'd MMM');
            dailyLeads[formattedDate] = { date: formattedDate, leads: 0 };
        });
        
        const relevantLeads = leads.filter(lead => {
            if (!lead.creationDate) return false;
            const leadDate = new Date(lead.creationDate);
            return getYear(leadDate) === year && monthIndexesToShow.includes(getMonth(leadDate));
        });

        relevantLeads.forEach((lead) => {
            if (!lead.creationDate) return;
            const leadDate = new Date(lead.creationDate);
            const formattedDate = formatDate(leadDate, 'd MMM');
            if (dailyLeads[formattedDate]) {
                dailyLeads[formattedDate].leads += 1;
            }
        });
        
        return Object.values(dailyLeads);
      }
    }, [filteredLeads, selectedPeriod, selectedState, selectedDistrict, isClient]);
  
    const isAllYearView = selectedPeriod.includes('all');
    const isSingleMonthView = !isAllYearView && (selectedPeriod.length === 1 || selectedPeriod.length === 0);

    if (isLoading || !isAuthenticated) {
        return null;
    }

    return (
        <AppContent>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight font-headline text-primary">
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
                            <p className="text-4xl font-bold text-primary">{isClient ? totalLeadsToday : '...'}</p>
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
                                selectedDistrict={selectedDistrict}
                                setSelectedDistrict={setSelectedDistrict}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                      {isClient && (
                        <LeadPerformanceChart 
                          performanceData={performanceData} 
                          xAxisLabel={isAllYearView ? "Month" : isSingleMonthView ? "Number of Days" : "Date"} 
                          dataKey={isAllYearView ? 'month' : isSingleMonthView ? 'day' : 'date'}
                        />
                      )}
                    </CardContent>
                </Card>
            </div>
        </AppContent>
    );
}
