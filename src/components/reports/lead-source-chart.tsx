
"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"

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

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  // Significantly further radius to ensure lines and text have space to breathe
  const radius = outerRadius + (percent < 0.05 ? 70 : 50);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Shorten name if it's too long to prevent text collision
  const displayName = name.length > 22 ? name.substring(0, 19) + "..." : name;

  return (
    <g>
      <text
        x={x}
        y={y}
        fill="#1e293b"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        className="select-none font-sans"
      >
        {`${displayName} (${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  // Sort data so largest slices are first, helping with label distribution
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-[550px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 40, right: 140, bottom: 40, left: 140 }}>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              fontSize: '12px',
              fontWeight: '700',
              padding: '10px 14px'
            }}
          />
          <Pie
            data={sortedData}
            cx="50%"
            cy="50%"
            labelLine={{ 
              stroke: '#94a3b8', 
              strokeWidth: 1.5,
              strokeDasharray: '2 2' 
            }}
            label={renderCustomizedLabel}
            outerRadius={140}
            innerRadius={95}
            paddingAngle={4}
            dataKey="value"
            minAngle={18} // Increased minimum angle to give even tiny slices a visible line
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={3}
                className="outline-none hover:opacity-85 transition-opacity cursor-pointer"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
