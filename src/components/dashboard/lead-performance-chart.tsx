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
  const maxLeads = Math.max(...performanceData.map((d) => d.leads), 0);
  const yAxisMax = Math.ceil((maxLeads * 1.2) / 50) * 50; // Add 20% padding and round to next 50

  const yAxisTicks =
    yAxisMax > 0 ? [0, yAxisMax / 3, (yAxisMax * 2) / 3, yAxisMax].map(Math.round) : [0, 50, 100, 150];


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
            domain={[0, yAxisMax > 0 ? yAxisMax : 150]}
            ticks={yAxisTicks}
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
