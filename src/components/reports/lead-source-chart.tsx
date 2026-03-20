
"use client"

import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type LeadSourceChartProps = {
  data: { name: string; value: number }[]
}

const COLORS = [
  "#38bdf8", // Cyan
  "#10b981", // Emerald
  "#4ade80", // Light Green
  "#fbbf24", // Amber
  "#f59e0b", // Orange
  "#e11d48", // Rose
  "#8b5cf6", // Violet
  "#64748b", // Slate
  "#ec4899", // Pink
  "#06b6d4", // Sky
  "#f97316", // Bright Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#ef4444", // Red
  "#a855f7", // Purple
];

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  const totalLeads = data.reduce((acc, curr) => acc + curr.value, 0);

  // Custom label function to match reference: NAME (PERCENT%) in UPPER CASE
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    
    // Position labels further outside to avoid overlapping
    const radius = outerRadius + 45;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#334155" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] font-bold tracking-tight"
      >
        {`${name.toUpperCase()} (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-[450px] flex items-center justify-center text-muted-foreground">
        No source data available.
      </div>
    );
  }

  return (
    <div className="w-full h-[700px] flex flex-col p-4 bg-background overflow-hidden">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              label={renderCustomizedLabel}
              outerRadius={120}
              innerRadius={80} // Donut shape
              dataKey="value"
              animationBegin={0}
              animationDuration={1200}
              stroke="white"
              strokeWidth={2}
              paddingAngle={0}
              minAngle={12} // Ensures small slices have enough space for their labels
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-90 transition-opacity cursor-pointer outline-none"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                fontWeight: '600'
              }}
              formatter={(value: number) => [
                `Count : ${value} Leads (${((value / totalLeads) * 100).toFixed(1)}%)`, 
                ''
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
