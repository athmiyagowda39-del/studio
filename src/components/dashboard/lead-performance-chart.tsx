'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Label } from 'recharts';

const chartConfig = {
  leads: {
    label: 'Leads',
    color: 'hsl(var(--primary))',
  },
};

const performanceData = [
  { day: '01', leads: 25 },
  { day: '02', leads: 10 },
  { day: '03', leads: 20 },
  { day: '04', leads: 30 },
  { day: '05', leads: 60 },
  { day: '06', leads: 40 },
  { day: '07', leads: 80 },
  { day: '08', leads: 0 },
  { day: '09', leads: 15 },
  { day: '10', leads: 50 },
  { day: '11', leads: 55 },
  { day: '12', leads: 45 },
  { day: '13', leads: 45 },
  { day: '14', leads: 50 },
  { day: '15', leads: 20 },
  { day: '16', leads: 10 },
  { day: '17', leads: 120 },
  { day: '18', leads: 0 },
  { day: '19', leads: 0 },
  { day: '20', leads: 0 },
  { day: '21', leads: 0 },
  { day: '22', leads: 0 },
  { day: '23', leads: 0 },
  { day: '24', leads: 0 },
  { day: '25', leads: 0 },
  { day: '26', leads: 0 },
  { day: '27', leads: 0 },
];

export default function LeadPerformanceChart() {
  return (
    <div className="mt-4">
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={performanceData} accessibilityLayer margin={{ left: 10, right: 30, top: 10, bottom: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            interval={0}
          >
            <Label value="Number of Days" position="insideBottom" offset={-15} />
          </XAxis>
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={[0, 150]}
            ticks={[0, 50, 100, 150]}
          >
              <Label value="Total Number of Leads" angle={-90} position="insideLeft" offset={0} style={{ textAnchor: 'middle' }} />
          </YAxis>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="leads"
            type="monotone"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{
              fill: 'hsl(var(--primary))',
              r: 4,
            }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
