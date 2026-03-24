
'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { LeadFormData } from '@/components/leads/lead-upload-form';

type GeographyPerformanceChartProps = {
  leads: LeadFormData[];
  onRegionClick?: (regionName: string) => void;
};

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#f43f5e', '#8b5cf6', '#14b8a6'];

export default function GeographyPerformanceChart({ leads, onRegionClick }: GeographyPerformanceChartProps) {
  const performanceData = useMemo(() => {
    const stats: Record<string, { region: string; leads: number; converted: number }> = {};

    leads.forEach((lead) => {
      // Robust normalization to prevent duplicates
      let rawRegion = (lead.state || 'Other').trim();
      if (!rawRegion) rawRegion = 'Other';
      
      const region = rawRegion
        .toLowerCase()
        .split(/\s+/) // Handle multiple spaces
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (!stats[region]) {
        stats[region] = { region, leads: 0, converted: 0 };
      }
      stats[region].leads += 1;
      if (lead.status === 'Order closed') {
        stats[region].converted += 1;
      }
    });

    // Sort by lead count descending
    return Object.values(stats).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  if (!leads.length) {
    return (
      <Card className="border-2 shadow-sm">
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No geography data available for the selected period.
        </CardContent>
      </Card>
    );
  }

  // Dynamic height for the chart based on the number of states
  const chartHeight = Math.max(300, performanceData.length * 45);

  return (
    <Card className="border-2 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-muted/5 border-b py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Geography-wise Performance</CardTitle>
        <p className="text-[11px] text-muted-foreground uppercase tracking-tighter">
          All Active States ({performanceData.length}) • Click bars to view leads
        </p>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 max-h-[850px]">
          <div className="p-6 space-y-8">
            <div style={{ height: `${chartHeight}px` }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={performanceData}
                  margin={{ left: 40, right: 40, top: 10, bottom: 10 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      onRegionClick?.(data.activePayload[0].payload.region);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="region"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="leads" 
                    barSize={24} 
                    radius={[0, 4, 4, 0]}
                    className="cursor-pointer"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border rounded-lg overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest">Region</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Leads</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Converted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((item, index) => (
                    <TableRow 
                      key={item.region} 
                      className="hover:bg-muted/10 cursor-pointer"
                      onClick={() => onRegionClick?.(item.region)}
                    >
                      <TableCell className="font-bold text-xs flex items-center gap-3 uppercase">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{item.region}</span>
                      </TableCell>
                      <TableCell className="text-center font-black text-sm">{item.leads}</TableCell>
                      <TableCell className="text-right font-black text-sm text-emerald-600">
                        {item.converted}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
