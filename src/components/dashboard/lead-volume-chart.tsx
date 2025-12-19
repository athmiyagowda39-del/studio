
'use client';

import {
  Card,
  CardContent,
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { getLeadData, indianStatesAndDistricts } from '@/lib/data';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const chartConfig = {
  leads: {
    label: 'Leads',
    color: 'hsl(var(--primary))',
  },
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function LeadVolumeChart() {
  const allLeads = useMemo(() => getLeadData(), []);
  const [period, setPeriod] = useState('November'); // Default to November as per data
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const states = useMemo(
    () => ['All', ...Object.keys(indianStatesAndDistricts)],
    []
  );

  const cities = useMemo(() => {
    if (selectedState === 'All') {
        const allCities = Object.values(indianStatesAndDistricts).flat();
        return ['All', ...Array.from(new Set(allCities))];
    }
    return ['All', ...(indianStatesAndDistricts[selectedState] || [])];
  }, [selectedState]);

  useEffect(() => {
    setSelectedCity('All');
  }, [selectedState]);


  const filteredData = useMemo(() => {
    const selectedMonthIndex = months.indexOf(period);
    
    let data = allLeads.filter(lead => {
      const leadMonth = new Date(lead.date).getMonth();
      return leadMonth === selectedMonthIndex;
    });

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
  }, [allLeads, period, selectedState, selectedCity]);

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
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="state">State:</Label>
            <Popover open={stateOpen} onOpenChange={setStateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stateOpen}
                  className="w-[200px] justify-between"
                >
                  {selectedState}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search state..." />
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {states.map((state) => (
                        <CommandItem
                          key={state}
                          value={state}
                          onSelect={(currentValue) => {
                            const valueToSet = states.find(s => s.toLowerCase() === currentValue) || 'All';
                            setSelectedState(valueToSet === selectedState ? 'All' : valueToSet);
                            setStateOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedState === state ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {state}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="city">City:</Label>
             <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cityOpen}
                  className="w-[200px] justify-between"
                >
                  {selectedCity}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search city..." />
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandList>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={(currentValue) => {
                          const valueToSet = cities.find(c => c.toLowerCase() === currentValue) || 'All';
                          setSelectedCity(valueToSet === selectedCity ? 'All' : valueToSet);
                          setCityOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCity === city ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
