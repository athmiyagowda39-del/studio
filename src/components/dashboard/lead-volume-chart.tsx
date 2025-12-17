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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { useMemo, useState } from 'react';
import { getLeadData } from '@/lib/data';
import { Label } from '../ui/label';

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
      const day = new Date(lead.date).getDate().toString();
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
        <div className="text-center mb-4">
          <CardTitle>Lead volume Analysis</CardTitle>
        </div>
        <div className="flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="period">Period:</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period" className="w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This month">This month</SelectItem>
                <SelectItem value="Last 3 months" disabled>Last 3 months</SelectItem>
                <SelectItem value="This year" disabled>This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="state">State:</Label>
            <Select value={selectedState} onValueChange={(value) => {
              setSelectedState(value)
              setSelectedCity('All')
            }}>
              <SelectTrigger id="state" className="w-[180px]">
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
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="city">City:</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedState === 'All'}>
              <SelectTrigger id="city" className="w-[180px]">
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
          <AreaChart data={filteredData} accessibilityLayer margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.padStart(2, '0')}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={[0, 150]}
              ticks={[0, 50, 100, 150]}
              label={{ value: 'Total number leads', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
                <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.8}
                />
                <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.1}
                />
                </linearGradient>
            </defs>
            <Area
              dataKey="leads"
              type="natural"
              fill="url(#fillLeads)"
              stroke="hsl(var(--primary))"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
