'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useMemo, useState } from 'react';
import { getLeadData } from '@/lib/data';

const chartConfig = {
  leads: {
    label: 'Leads',
    color: 'hsl(var(--primary))',
  },
};

export default function LeadVolumeChart() {
  const allLeads = useMemo(() => getLeadData(), []);
  const [period, setPeriod] = useState('This month');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  const states = useMemo(
    () => ['All', ...Array.from(new Set(allLeads.map((lead) => lead.state)))],
    [allLeads]
  );
  const cities = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          allLeads
            .filter(
              (lead) =>
                selectedState === 'All' || lead.state === selectedState
            )
            .map((lead) => lead.city)
        )
      ),
    ],
    [allLeads, selectedState]
  );

  const filteredData = useMemo(() => {
    let data = allLeads;
    if (selectedState !== 'All') {
      data = data.filter((lead) => lead.state === selectedState);
    }
    if (selectedCity !== 'All') {
      data = data.filter((lead) => lead.city === selectedCity);
    }

    // Aggregate data by day
    const aggregated = data.reduce((acc, lead) => {
      const day = new Date(lead.date).getDate().toString().padStart(2, '0');
      if (!acc[day]) {
        acc[day] = { day, leads: 0 };
      }
      acc[day].leads += lead.leads;
      return acc;
    }, {} as { [key: string]: { day: string; leads: number } });
    
    return Object.values(aggregated).sort((a,b) => parseInt(a.day) - parseInt(b.day));
  }, [allLeads, selectedState, selectedCity]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Lead Volume Analysis</CardTitle>
            <CardDescription>
              A visual representation of lead volume over time.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This month">This month</SelectItem>
                <SelectItem value="Last 3 months" disabled>Last 3 months</SelectItem>
                <SelectItem value="This year" disabled>This year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedState} onValueChange={(value) => {
              setSelectedState(value)
              setSelectedCity('All')
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={filteredData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
             <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={[0, 'dataMax + 20']}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="leads" fill="var(--color-leads)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
