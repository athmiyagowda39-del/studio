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
import LeadPerformanceFilters from '@/components/dashboard/lead-performance-filters';
import { useState, useMemo } from 'react';
import { useAuthContext } from '@/context/auth-context';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
];

export default function DashboardPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    let q = query(collection(firestore, 'leads'));
    // Non-admin users can only see leads assigned to them.
    if (user.role !== 'admin') {
      q = query(q, where('subAdminId', '==', user.uid));
    }
    return q;
  }, [user, firestore]);

  const { data: allLeads, isLoading } = useCollection<LeadFormData>(leadsQuery);

  const [period, setPeriod] = useState('November');
  const [city, setCity] = useState('All');

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

    const monthIndex = months.indexOf(period);
    const year = new Date().getFullYear();

    const filteredLeads = allLeads.filter((lead) => {
      const leadDate = new Date(lead.creationDate);
      const isMonthMatch = leadDate.getMonth() === monthIndex;
      const isCityMatch = city === 'All' || lead.district === city;
      return isMonthMatch && isCityMatch;
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dailyLeads = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString().padStart(2, '0'),
      leads: 0,
    }));

    filteredLeads.forEach((lead) => {
      const leadDate = new Date(lead.creationDate);
      if (leadDate.getMonth() === monthIndex) {
        const dayOfMonth = leadDate.getDate();
        if (dayOfMonth > 0 && dayOfMonth <= daysInMonth) {
          dailyLeads[dayOfMonth - 1].leads += 1;
        }
      }
    });

    return dailyLeads;
  }, [allLeads, period, city]);

  if (isLoading || !user) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          WELCOME {user.username.toUpperCase()}!
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
          <LeadPerformanceFilters
            period={period}
            setPeriod={setPeriod}
            city={city}
            setCity={setCity}
          />
          <LeadPerformanceChart performanceData={performanceData} />
        </CardContent>
      </Card>
    </div>
  );
}
