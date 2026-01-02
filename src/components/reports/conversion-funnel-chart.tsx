
'use client';
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart';

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

export default function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const chartData = data.map((item, index) => ({ ...item, fill: colors[index % colors.length] }));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <FunnelChart>
          <Tooltip content={<ChartTooltipContent />} />
          <Funnel dataKey="value" data={chartData} isAnimationActive>
            <LabelList
              position="right"
              fill="#000"
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
    </div>
  );
}
