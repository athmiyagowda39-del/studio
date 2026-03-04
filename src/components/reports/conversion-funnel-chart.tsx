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
            <FunnelChart margin={{ top: 40, bottom: 40, right: 150 }}>
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
                  dataKey="name"
                  content={(props: any) => {
                    const { x, y, width, height, value } = props;
                    return (
                      <text
                        x={x + 15}
                        y={y + height / 2}
                        dy={4}
                        fill="hsl(var(--foreground))"
                        className="font-semibold cursor-pointer hover:fill-primary transition-colors text-[14px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStageClick?.(value);
                        }}
                      >
                        {value}
                      </text>
                    );
                  }}
                />
 
                <LabelList
                  position="center"
                  dataKey="value"
                  content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    const stageName = chartData[index]?.name;
                    return (
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        dy={4}
                        fill="#fff"
                        textAnchor="middle"
                        className="font-bold text-lg cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStageClick?.(stageName);
                        }}
                      >
                        {value}
                      </text>
                    );
                  }}
                />
              </Funnel>
 
            </FunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
