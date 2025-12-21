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

type PerformanceDataPoint = {
  day: string;
  leads: number;
};

type LeadPerformanceChartProps = {
  performanceData: PerformanceDataPoint[];
};

export default function LeadPerformanceChart({
  performanceData,
}: LeadPerformanceChartProps) {
  return (
    <div className="mt-4">
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart
          data={performanceData}
          accessibilityLayer
          margin={{ left: 10, right: 30, top: 10, bottom: 20 }}
        >
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
            <Label
              value="Total Number of Leads"
              angle={-90}
              position="insideLeft"
              offset={0}
              style={{ textAnchor: 'middle' }}
            />
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
