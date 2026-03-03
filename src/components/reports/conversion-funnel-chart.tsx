'use client';
 
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell,
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
      <div className="w-full max-w-4xl h-[650px]">
        <ChartContainer
          config={chartConfig}
          className="w-full h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 40, bottom: 40, right: 150, left: 150 }}>
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                wrapperStyle={{ pointerEvents: 'none' }}
              />
 
              <Funnel
                dataKey="value"
                data={chartData}
                isAnimationActive={false}
                // neckWidth ensures the bottom sections (Order Closed) stay wide enough to click
                neckWidth={250} 
                // neckHeight ensures the narrow part of the funnel has enough vertical space
                neckHeight={150}
                onClick={(stage: any) => {
                  if (stage && stage.name) {
                    onStageClick?.(stage.name);
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="outline-none cursor-pointer" />
                ))}
                
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  dataKey="name"
                  className="font-bold text-sm"
                  style={{ pointerEvents: 'none' }}
                />
 
                <LabelList
                  position="center"
                  fill="#fff"
                  dataKey="value"
                  className="font-bold text-xl"
                  style={{ pointerEvents: 'none' }}
                />
              </Funnel>
 
            </FunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
