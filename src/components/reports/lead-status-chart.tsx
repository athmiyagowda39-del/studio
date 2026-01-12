
'use client';
import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

type LeadStatusChartProps = {
  data: { name: string; value: number }[];
};

const chartConfig = {
  value: {
    label: 'Leads',
  },
  Attended: {
    label: 'Attended',
    color: 'hsl(var(--chart-2))',
  },
  'Not viewed': {
    label: 'Not viewed',
    color: 'hsl(var(--chart-4))',
  },
  'Demo Given': {
    label: 'Demo Given',
    color: 'hsl(var(--chart-3))',
  },
  Unattended: {
    label: 'Unattended',
    color: 'hsl(var(--primary))',
  },
  'Pursuing to Purchase': {
    label: 'Pursuing to Purchase',
    color: 'hsl(120 100% 35%)',
  },
  'Not interested': {
    label: 'Not interested',
    color: 'hsl(var(--destructive))',
  },
  'Order closed': {
    label: 'Order closed',
    color: 'hsl(60 100% 50%)',
  },
  'Proposal Sent': {
    label: 'Proposal Sent',
    color: 'hsl(260 100% 70%)',
  }
};


export default function LeadStatusChart({ data }: LeadStatusChartProps) {
  const chartData = data.map(item => ({
    ...item,
    fill: chartConfig[item.name as keyof typeof chartConfig]?.color || 'hsl(var(--muted-foreground))'
  }));
  
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[400px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={100}
          strokeWidth={5}
        >
           {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
