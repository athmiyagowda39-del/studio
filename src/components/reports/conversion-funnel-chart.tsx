'use client';
 
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
 
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart';
 
type ConversionFunnelChartProps = {
  data: { name: string; value: number }[];
  onStageClick?: (stageName: string) => void;
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
  onStageClick,
}: ConversionFunnelChartProps) {
 
  // Add color to each stage
  const chartData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));
 
  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item) => [
      item.name,
      { label: item.name },
    ])
  );
 
  return (
    <div
      className={`w-full flex justify-center ${
        onStageClick ? 'clickable-funnel' : ''
      }`}
    >
      <div className="w-full max-w-4xl">
        <ChartContainer
          config={chartConfig}
          className="w-full"
        >
          <ResponsiveContainer width="100%" height={650}>
            <FunnelChart margin={{ top: 40, bottom: 40 }}>
              <Tooltip />
 
              <Funnel
                dataKey="value"
                data={chartData}
                isAnimationActive
                onClick={(stage: any) =>
                  onStageClick?.(stage?.name)
                }
              >
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  dataKey="name"
                  className="font-semibold"
                />
 
                <LabelList
                  position="center"
                  fill="#fff"
                  dataKey="value"
                  className="font-bold text-lg"
                />
              </Funnel>
 
            </FunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}