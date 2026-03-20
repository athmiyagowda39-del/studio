
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
  "#38bdf8", // Blue (Cold Call style)
  "#34d399", // Green (Advertisement style)
  "#6ee7b7", // Teal (Web Download style)
  "#fbbf24", // Yellow (Seminar style)
  "#e11d48", // Red (Partner style)
  "#f59e0b", // Orange (Store style)
  "#a855f7", // Purple (Referral style)
  "#64748b", // Slate
];

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  const totalLeads = data.reduce((acc, curr) => acc + curr.value, 0);

  // Custom label function to match reference: NAME (PERCENT%) in UPPER CASE
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    
    // Position labels further outside to avoid overlapping
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#334155" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[11px] font-bold tracking-tighter"
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
    <div className="w-full h-[600px] flex flex-col p-4 bg-background overflow-hidden">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
              label={renderCustomizedLabel}
              outerRadius={130}
              innerRadius={80} // Donut shape
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
              stroke="white"
              strokeWidth={2}
              paddingAngle={0}
              minAngle={15} // Prevents tiny segments from disappearing
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
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => [
                `${value} Leads (${((value / totalLeads) * 100).toFixed(1)}%)`, 
                'Count'
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
