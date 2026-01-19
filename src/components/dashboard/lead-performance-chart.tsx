
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
  day?: string;
  hour?: string;
  month?: string;
  leads: number;
};

type LeadPerformanceChartProps = {
  performanceData: PerformanceDataPoint[];
  xAxisLabel?: string;
  dataKey?: 'day' | 'month' | 'hour';
};

export default function LeadPerformanceChart({
  performanceData,
  xAxisLabel = 'Number of Days',
  dataKey = 'day',
}: LeadPerformanceChartProps) {
  const maxLeads = Math.max(...performanceData.map((d) => d.leads), 0);
  const yAxisMax = Math.ceil((maxLeads * 1.2) / 10) * 10 || 10;

  const yAxisTicks =
    yAxisMax > 0 ? [0, Math.round(yAxisMax / 2), yAxisMax] : [0, 5, 10];


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
            dataKey={dataKey}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            interval={0}
          >
            <Label value={xAxisLabel} position="insideBottom" offset={-15} />
          </XAxis>
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={[0, yAxisMax]}
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
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
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
