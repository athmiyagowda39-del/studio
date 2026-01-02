
'use client';
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type ConversionFunnelChartProps = {
  data: { name: string; value: number }[];
};

const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

export default function ConversionFunnelChart({
  data,
}: ConversionFunnelChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  const chartConfig = {} satisfies ChartConfig;
  data.forEach((item) => {
    chartConfig[item.name as keyof typeof chartConfig] = {
      label: item.name,
    };
  });

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ChartContainer
        config={chartConfig}
        className="min-h-[200px] w-full"
      >
        <ResponsiveContainer>
          <FunnelChart>
            <Tooltip content={<ChartTooltipContent hideLabel />} />
            <Funnel dataKey="value" data={chartData} isAnimationActive>
              <LabelList
                position="right"
                fill="hsl(var(--foreground))"
                stroke="none"
                dataKey="name"
                className="font-semibold"
              />
              <LabelList
                position="center"
                fill="#fff"
                stroke="none"
                dataKey="value"
                className="font-bold text-lg"
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
