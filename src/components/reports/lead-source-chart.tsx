
"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"

type LeadSourceChartProps = {
  data: { name: string; value: number }[]
}

const COLORS = [
  "#FF6B35", // Orange
  "#181ecf", // Blue
  "#06B6D4", // Cyan
  "#22d79b", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Sky Blue
  "#10B981", // Teal
  "#64748B", // Slate
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  // Move labels significantly further out to prevent overlapping with the pie or other labels
  // Using a larger radius for smaller percentages to avoid crowding
  const radius = outerRadius + (percent < 0.05 ? 65 : 45);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Shorten name if it's too long to prevent text collision
  const displayName = name.length > 20 ? name.substring(0, 17) + "..." : name;

  return (
    <g>
      <text
        x={x}
        y={y}
        fill="#334155"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        className="select-none"
      >
        {`${displayName} (${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  // Sort data so largest slices are at the top/sides for better label distribution
  // This helps prevent labels for tiny slices from merging
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-[550px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 40, right: 120, bottom: 40, left: 120 }}>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          />
          <Pie
            data={sortedData}
            cx="50%"
            cy="50%"
            labelLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
            label={renderCustomizedLabel}
            outerRadius={140}
            innerRadius={90}
            paddingAngle={3}
            dataKey="value"
            minAngle={12} // Increased slightly to give small slices more presence
            animationBegin={0}
            animationDuration={1200}
          >
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
