
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getLeadsForToday, getLeadData, type Lead } from '@/lib/data';
import LeadPerformanceChart from '@/components/dashboard/lead-performance-chart';
import LeadPerformanceFilters from '@/components/dashboard/lead-performance-filters';
import { useState, useMemo, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/auth-context';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [totalLeadsToday, setTotalLeadsToday] = useState(0);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const authContext = useContext(AuthContext);

  const [period, setPeriod] = useState('November');
  const [city, setCity] = useState('All');

  useEffect(() => {
    setIsClient(true);
    setTotalLeadsToday(getLeadsForToday());
    setAllLeads(getLeadData());
  }, []);

  const performanceData = useMemo(() => {
    if (!isClient) return [];

    const monthIndex = months.indexOf(period);
    const year = 2025; // Fixed year from data generation

    const filteredLeads = allLeads.filter((lead) => {
      const leadDate = new Date(lead.date);
      const isMonthMatch = leadDate.getMonth() === monthIndex;
      const isStateMatch = lead.state === 'Karnataka'; // State is fixed
      const isCityMatch = city === 'All' || lead.city === city;
      return isMonthMatch && isStateMatch && isCityMatch;
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dailyLeads = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString().padStart(2, '0'),
      leads: 0,
    }));

    filteredLeads.forEach((lead) => {
      const leadDate = new Date(lead.date);
      // Ensure we only add leads for the correct month.
      if (leadDate.getMonth() === monthIndex) {
        const dayOfMonth = leadDate.getDate();
        if (dayOfMonth > 0 && dayOfMonth <= daysInMonth) {
          dailyLeads[dayOfMonth - 1].leads += lead.leads;
        }
      }
    });

    return dailyLeads;
  }, [allLeads, period, city, isClient]);

  if (!isClient || !authContext?.user) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          WELCOME {authContext.user.username.toUpperCase()}!
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
              Total number of Leads: {totalLeadsToday}
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
