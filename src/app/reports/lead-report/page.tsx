
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LeadStatusChart from '@/components/reports/lead-status-chart';
import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { indianStatesAndDistricts } from '@/lib/data';

const allStates = Object.keys(indianStatesAndDistricts);

const getLeadStatusesForState = (state: string) => {
  // In a real application, this data would be fetched based on the state.
  // Here, we'll generate some semi-random data to simulate the change.
  const seed = state.charCodeAt(0) + (state.charCodeAt(1) || 0);
  const baseData = {
    'Total Leads': 890,
    'Not viewed': 32,
    'Unattended': 2,
    'Not interested': 201,
    'Attended': 500,
    'Demo Given': 301,
    'Pursuing to Purchase': 5,
    'Order closed': 10,
  };

  if (state === 'Karnataka') {
    return Object.entries(baseData).map(([status, value]) => ({ status, value }));
  }

  const slightlyRandomize = (value: number) => {
    return Math.max(0, Math.round(value * (0.8 + (seed % 40) / 100)));
  }

  const newStateData = {
    'Total Leads': slightlyRandomize(baseData['Total Leads']),
    'Not viewed': slightlyRandomize(baseData['Not viewed']),
    'Unattended': slightlyRandomize(baseData['Unattended']),
    'Not interested': slightlyRandomize(baseData['Not interested']),
    'Attended': slightlyRandomize(baseData['Attended']),
    'Demo Given': slightlyRandomize(baseData['Demo Given']),
    'Pursuing to Purchase': slightlyRandomize(baseData['Pursuing to Purchase']),
    'Order closed': slightlyRandomize(baseData['Order closed']),
  };

  return Object.entries(newStateData).map(([status, value]) => ({ status, value }));
};


export default function LeadReportPage() {
  const [selectedState, setSelectedState] = useState('Karnataka');

  const leadStatuses = useMemo(() => {
    return getLeadStatusesForState(selectedState);
  }, [selectedState]);

  const chartData = leadStatuses
    .filter((s) => s.status !== 'Total Leads')
    .map((item) => ({
      name: item.status,
      value: item.value,
      fill: `var(--color-${item.status.replace(/\s+/g, '')})`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Lead Report</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="font-medium">Select State:</span>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {allStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                Lead Status Breakdown for {selectedState}
              </h2>
              {leadStatuses.map((item) => (
                <div
                  key={item.status}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <span className="font-medium">{item.status}:</span>
                  <span className="font-bold text-primary">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <LeadStatusChart data={chartData} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
