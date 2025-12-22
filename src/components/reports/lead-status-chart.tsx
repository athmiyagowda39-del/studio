
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
  data: { name: string; value: number; fill: string }[];
};

const chartConfig = {
  value: {
    label: 'Leads',
  },
  Attended: {
    label: 'Attended',
    color: 'hsl(var(--chart-1))',
  },
  'Not viewed': {
    label: 'Not viewed',
    color: 'hsl(var(--chart-2))',
  },
  'Demo Given': {
    label: 'Demo Given',
    color: 'hsl(var(--chart-3))',
  },
  Unattended: {
    label: 'Unattended',
    color: 'hsl(var(--chart-4))',
  },
  'Pursuing to Purchase': {
    label: 'Pursuing to Purchase',
    color: 'hsl(var(--chart-5))',
  },
  'Not interested': {
    label: 'Not interested',
    color: 'hsl(var(--destructive))',
  },
  'Order closed': {
    label: 'Order closed',
    color: 'hsl(var(--accent))',
  },
};


export default function LeadStatusChart({ data }: LeadStatusChartProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[350px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={80}
          strokeWidth={5}
        >
           {data.map((entry, index) => (
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
