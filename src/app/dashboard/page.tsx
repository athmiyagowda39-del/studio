
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
import { startOfDay, endOfDay, getDay, format as formatDate, eachDayOfInterval, getMonth, getYear, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import AppContent from '@/components/layout/app-content';
import LeadPerformanceFilters from '@/components/dashboard/lead-performance-filters';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/context/users-context';
import { Label } from '@/components/ui/label';
import { firestore as db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';


const LeadPerformanceChart = dynamic(
  () => import('@/components/dashboard/lead-performance-chart'),
  { ssr: false, loading: () => <div className="h-[300px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

export default function DashboardPage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { users } = useUsers();
    const router = useRouter();
    const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [selectedPeriod, setSelectedPeriod] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
    const [selectedExecutive, setSelectedExecutive] = useState<string>('all');
    
    useEffect(() => {
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


    useEffect(() => {
      if (!isAuthenticated || !user) return;

      setIsDataLoading(true);
      const leadsCollection = collection(db, 'leads');
      let leadsQuery = query(leadsCollection);

      // If the user is an executive, only fetch their leads.
      if (user.role === 'Executive') {
          leadsQuery = query(leadsCollection, where('executive', '==', user.username));
      }
      
      const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
          const leadsData = snapshot.docs.map(doc => ({ ...doc.data(), leadId: doc.id }) as LeadFormData);
          setAllLeads(leadsData);
          setIsDataLoading(false);
      }, (error) => {
          console.error("Error fetching leads:", error);
          setIsDataLoading(false);
      });

      return () => unsubscribe();
  }, [isAuthenticated, user]);

    const filteredLeads = useMemo(() => {
        if (!allLeads || !user) return [];

        // For Admins/Sub Admins, their view is global.
        if (user.role === 'Admin' || user.role === 'Sub Admin') {
            if (selectedExecutive !== 'all') {
                return allLeads.filter(lead => lead.executive === selectedExecutive);
            }
            return allLeads; // Show all leads for admin by default
        }

        // For Executives, they only see leads assigned to them.
        if (user.role === 'Executive') {
            return allLeads.filter(lead => lead.executive === user.username);
        }
        
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
      const isAllYearView = selectedPeriod.includes('all');

      if (isAllYearView) {
        const monthlyData = eachMonthOfInterval({
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 1),
        }).map(monthDate => ({
          month: formatDate(monthDate, 'MMM'),
          leads: 0,
        }));

        const relevantLeads = leads.filter(lead => getYear(new Date(lead.creationDate)) === year);

        relevantLeads.forEach(lead => {
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
        // Default to current month if no selection
        monthIndexesToShow = [getMonth(new Date())];
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
            const leadDate = new Date(lead.creationDate);
            return getYear(leadDate) === year && getMonth(leadDate) === monthIndex;
        });

        relevantLeads.forEach(lead => {
            const dayOfMonth = new Date(lead.creationDate).getDate() - 1; // 0-indexed
            if (dailyData[dayOfMonth]) {
                dailyData[dayOfMonth].leads++;
            }
        });
        
        return dailyData;
      } else { // Multiple months selected
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
            const leadDate = new Date(lead.creationDate);
            return getYear(leadDate) === year && monthIndexesToShow.includes(getMonth(leadDate));
        });

        relevantLeads.forEach((lead) => {
            const leadDate = new Date(lead.creationDate);
            const formattedDate = formatDate(leadDate, 'd MMM');
            if (dailyLeads[formattedDate]) {
                dailyLeads[formattedDate].leads += 1;
            }
        });
        
        return Object.values(dailyLeads);
      }
    }, [filteredLeads, selectedPeriod, selectedState, selectedDistrict]);
  
    const isAllYearView = selectedPeriod.includes('all');
    const isSingleMonthView = !isAllYearView && (selectedPeriod.length === 1 || selectedPeriod.length === 0);

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
                      <LeadPerformanceChart 
                        performanceData={performanceData} 
                        xAxisLabel={isAllYearView ? "Month" : isSingleMonthView ? "Number of Days" : "Date"} 
                        dataKey={isAllYearView ? 'month' : isSingleMonthView ? 'day' : 'date'}
                      />
                    </CardContent>
                </Card>
            </div>
        </AppContent>
    );
}
