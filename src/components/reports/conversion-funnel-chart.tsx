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
 
  // We use a non-linear scaling for the visual width to ensure that stages with 
  // small counts (like 1 or 2) are still clearly visible and clickable compared to large counts (587).
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const chartData = data.map((item, index) => {
    // visualValue determines the width. 
    // We give it a "floor" so it never gets too thin.
    const visualValue = (item.value / maxValue) * 100;
    const paddedVisualValue = Math.max(visualValue, 8) + (index === 0 ? 20 : 0); 

    return {
      ...item,
      visualValue: paddedVisualValue,
      fill: colors[index % colors.length],
    };
  });
 
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
      <div className="w-full max-w-5xl">
        <ChartContainer
          config={chartConfig}
          className="w-full"
        >
          <ResponsiveContainer width="100%" height={700}>
            <FunnelChart margin={{ top: 40, bottom: 40, right: 250, left: 50 }}>
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [props.payload.value, props.payload.name]}
              />
 
              <Funnel
                dataKey="visualValue"
                data={chartData}
                isAnimationActive
                onClick={(stage: any) =>
                  onStageClick?.(stage?.name)
                }
              >
                {/* Stage Names on the Right */}
                <LabelList
                  position="right"
                  dataKey="name"
                  content={(props: any) => {
                    const { x, y, width, height, value } = props;
                    return (
                      <text
                        x={x + 25}
                        y={y + height / 2}
                        dy={4}
                        fill="hsl(var(--foreground))"
                        className="font-bold cursor-pointer hover:fill-primary transition-colors text-[16px]"
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
 
                {/* Real Numerical Values in the Center */}
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
                        dy={5}
                        fill="#fff"
                        textAnchor="middle"
                        className="font-extrabold text-xl cursor-pointer drop-shadow-md"
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