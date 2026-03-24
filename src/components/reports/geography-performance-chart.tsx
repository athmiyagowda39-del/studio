
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
import type { LeadFormData } from '@/components/leads/lead-upload-form';

type GeographyPerformanceChartProps = {
  leads: LeadFormData[];
};

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];

export default function GeographyPerformanceChart({ leads }: GeographyPerformanceChartProps) {
  const performanceData = useMemo(() => {
    const stats: Record<string, { region: string; leads: number; converted: number }> = {};

    leads.forEach((lead) => {
      const region = (lead.state || 'Others').trim();
      if (!stats[region]) {
        stats[region] = { region, leads: 0, converted: 0 };
      }
      stats[region].leads += 1;
      if (lead.status === 'Order closed') {
        stats[region].converted += 1;
      }
    });

    const sortedData = Object.values(stats).sort((a, b) => b.leads - a.leads);

    if (sortedData.length <= 6) {
      return sortedData;
    }

    const top5 = sortedData.slice(0, 5);
    const others = sortedData.slice(5).reduce(
      (acc, curr) => ({
        region: 'Others',
        leads: acc.leads + curr.leads,
        converted: acc.converted + curr.converted,
      }),
      { region: 'Others', leads: 0, converted: 0 }
    );

    return [...top5, others];
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

  return (
    <Card className="border-2 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/5 border-b py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Geography-wise Performance</CardTitle>
        <p className="text-[11px] text-muted-foreground uppercase tracking-tighter">Lead distribution & conversions by region</p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={performanceData}
              margin={{ left: 40, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="region"
                type="category"
                axisLine={false}
                tickLine={false}
                width={100}
                style={{ fontSize: '12px', fontWeight: '600' }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="leads" barSize={24} radius={[0, 4, 4, 0]}>
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Region</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Leads</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Converted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((item, index) => (
                <TableRow key={item.region} className="hover:bg-muted/10">
                  <TableCell className="font-medium text-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {item.region}
                  </TableCell>
                  <TableCell className="text-center font-bold text-sm">{item.leads}</TableCell>
                  <TableCell className="text-right font-bold text-sm text-emerald-600">
                    {item.converted}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
