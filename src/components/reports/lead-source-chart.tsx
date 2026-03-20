
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

const SOURCE_COLORS: Record<string, string> = {
  "WALK-IN": "#FF6B6B",
  "REFERRAL": "#4ECDC4",
  "COLD CALL": "#45B7D1",
  "OTHER": "#FFA07A",
  "WEBSITE": "#98D8C8",
  "TELECALLING": "#F7DC6F",
  "EMAIL CAMPAIGN": "#BB8FCE",
  "SOCIAL MEDIA": "#85C1E9",
  "INDIAMART": "#F8C471",
  "GOOGLE": "#82E0AA",
  "DEMO REQUEST": "#F1948A",
  "GOOGLE ADS": "#85929E",
  "FACEBOOK ADS": "#D7BDE2",
  "LINKEDIN": "#A3E4D7",
};

const COLORS = [
  "#38bdf8", // Cyan fallback
  "#10b981", 
  "#fbbf24", 
  "#f43f5e", 
  "#8b5cf6", 
  "#14b8a6", 
  "#06b6d4", 
  "#4ade80", 
  "#e11d48", 
  "#a855f7", 
  "#64748b", 
  "#ef4444", 
];

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  const totalLeads = data.reduce((acc, curr) => acc + curr.value, 0);

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const angle = -midAngle * RADIAN;
    
    // Coordinates for the arrow line
    // Start at the edge of the donut
    const sx = cx + outerRadius * Math.cos(angle);
    const sy = cy + outerRadius * Math.sin(angle);
    
    // End just before the text - Increased length to prevent overlap
    const lineLength = 60;
    const ex = cx + (outerRadius + lineLength) * Math.cos(angle);
    const ey = cy + (outerRadius + lineLength) * Math.sin(angle);
    
    // Text position
    const textRadius = outerRadius + lineLength + 12;
    const tx = cx + textRadius * Math.cos(angle);
    const ty = cy + textRadius * Math.sin(angle);

    // Arrowhead calculations
    const arrowSize = 6;
    const x1 = ex - arrowSize * Math.cos(angle - Math.PI / 6);
    const y1 = ey - arrowSize * Math.sin(angle - Math.PI / 6);
    const x2 = ex - arrowSize * Math.cos(angle + Math.PI / 6);
    const y2 = ey - arrowSize * Math.sin(angle + Math.PI / 6);

    return (
      <g>
        {/* The arrow line */}
        <line 
          x1={sx} 
          y1={sy} 
          x2={ex} 
          y2={ey} 
          stroke="#94a3b8" 
          strokeWidth={1.5} 
        />
        {/* The arrowhead (>) */}
        <path
          d={`M ${x1} ${y1} L ${ex} ${ey} L ${x2} ${y2}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* The label text */}
        <text 
          x={tx} 
          y={ty} 
          fill="#1e293b" 
          textAnchor={tx > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          className="text-[11px] font-black tracking-tight"
        >
          {`${name.toUpperCase()} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
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
    <div className="w-full h-[750px] flex flex-col p-4 bg-background overflow-hidden">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%" // Pull the chart slightly up
              labelLine={false} 
              label={renderCustomizedLabel}
              outerRadius={135}
              innerRadius={85}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              stroke="white"
              strokeWidth={3}
              paddingAngle={1}
              minAngle={25} // Forced minimum angle to prevent label overlapping for tiny slices
            >
              {data.map((entry, index) => {
                const normalizedName = entry.name.toUpperCase().trim();
                const customColor = SOURCE_COLORS[normalizedName];
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={customColor || COLORS[index % COLORS.length]} 
                    className="hover:opacity-90 transition-opacity cursor-pointer outline-none"
                  />
                );
              })}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                fontSize: '13px',
                fontWeight: '700',
                padding: '12px'
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
