
"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"

type LeadSourceChartProps = {
  data: { name: string; value: number }[]
}

const COLORS = [
  "#3B82F6", // Blue (Cold Call)
  "#10B981", // Green (Advertisement)
  "#06B6D4", // Light Teal (Web Download)
  "#F59E0B", // Yellow (Seminar Partner)
  "#EF4444", // Red (Partner)
  "#F97316", // Orange (Online Store)
  "#8B5CF6", // Purple (Referral)
  "#EC4899", // Pink
  "#64748B", // Gray
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#333"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="600"
    >
      {`${name} (${(percent * 100).toFixed(2)}%)`}
    </text>
  );
};

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
            label={renderCustomizedLabel}
            outerRadius={130}
            innerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
