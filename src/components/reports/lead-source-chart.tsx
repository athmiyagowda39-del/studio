
"use client"

import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type LeadSourceChartProps = {
  data: { name: string; value: number }[]
}

const COLORS = [
  "#FF6B35", // Vibrant Orange
  "#181ecf", // Deep Blue
  "#06B6D4", // Bright Cyan
  "#22d79b", // Fresh Emerald
  "#8B5CF6", // Royal Purple
  "#EC4899", // Vivid Pink
  "#F59E0B", // Golden Amber
  "#EF4444", // Strong Red
  "#3B82F6", // Sky Blue
  "#10B981", // Dark Teal
  "#64748B", // Professional Slate
];

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  const totalLeads = data.reduce((acc, curr) => acc + curr.value, 0);

  // Custom label function to show Name and Percentage clearly
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.25; // Move labels further outside
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[11px] font-bold uppercase tracking-tight"
      >
        {`${name} (${(percent * 100).toFixed(1)}%)`}
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
    <div className="w-full h-[550px] flex flex-col p-4 bg-background">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              labelLine={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '2 2' }}
              label={renderCustomizedLabel}
              outerRadius={130}
              innerRadius={75} // Donut style for modern look
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => [
                `${value} Leads (${((value / totalLeads) * 100).toFixed(2)}%)`, 
                'Count'
              ]}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ 
                paddingTop: '40px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
