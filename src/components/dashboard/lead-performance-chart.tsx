
'use client';

import {
  ChartContainer,
  ChartTooltip,
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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2.5 text-sm shadow-lg">
        <div className="grid grid-cols-1 gap-1.5">
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            />
            <div className="flex flex-1 justify-between gap-4">
              <span className="text-muted-foreground">Total number of leads</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {payload[0].value}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
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
            content={<CustomTooltip />}
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
