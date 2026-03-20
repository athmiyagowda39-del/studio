
"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
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
  // Sort data so highest values are at the top
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const percentage = ((value / total) * 100).toFixed(2);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-xl">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{name}</p>
          <p className="text-sm font-black text-primary">{value} Leads</p>
          <p className="text-[10px] font-bold text-emerald-600">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col p-4">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={120}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={24}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                style={{ fill: '#1e293b', fontSize: 12, fontWeight: 800 }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {sortedData.slice(0, 9).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <span className="text-[10px] font-bold text-muted-foreground truncate uppercase">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
