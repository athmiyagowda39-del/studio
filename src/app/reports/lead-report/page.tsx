
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LeadStatusChart from '@/components/reports/lead-status-chart';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { indianStatesAndDistricts } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { format } from 'date-fns';

const allStates = Object.keys(indianStatesAndDistricts);

const leadStatusOptions = [
    'Attended',
    'Not viewed',
    'Demo Given',
    'Unattended',
    'Pursuing to Purchase',
    'Not interested',
    'Order closed',
];

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
  const [openState, setOpenState] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);

  useEffect(() => {
    try {
      const storedLeads = localStorage.getItem('uploadedLeads');
      if (storedLeads) {
        const parsedLeads: LeadFormData[] = JSON.parse(storedLeads);
        // This is mock data for status. In a real app this would come from the data
        const leadsWithStatus = parsedLeads.map((lead, index) => ({
          ...lead,
          status: leadStatusOptions[index % leadStatusOptions.length],
        }));
        setAllLeads(leadsWithStatus as any);
      }
    } catch (error) => {
      console.error('Failed to load leads from local storage', error);
    }
  }, []);

  const leadStatuses = useMemo(() => {
    return getLeadStatusesForState(selectedState);
  }, [selectedState]);
  
  useEffect(() => {
    if (selectedStatus && selectedStatus !== 'all-statuses') {
      const leads = allLeads.filter(lead => 
        lead.state === selectedState && (lead as any).status === selectedStatus
      );
      setFilteredLeads(leads);
    } else {
      setFilteredLeads([]);
    }
  }, [selectedState, selectedStatus, allLeads]);


  const chartData = leadStatuses
    .filter((s) => s.status !== 'Total Leads')
    .map((item) => ({
      name: item.status,
      value: item.value,
      fill: `var(--color-${item.status.replace(/\s+/g, '')})`,
    }));
    
  const handleStateSelect = (currentState: string) => {
    const state = allStates.find(s => s.toLowerCase() === currentState);
    if(state) {
        setSelectedState(state);
    }
    setOpenState(false);
  }
  
  const handleStatusChange = (value: string) => {
      setSelectedStatus(value === 'all-statuses' ? '' : value);
  }

  const shouldShowDetails = selectedStatus && selectedStatus !== 'all-statuses';

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Lead Report</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="font-medium">Select State:</span>
                <Popover open={openState} onOpenChange={setOpenState}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openState}
                    className="w-[250px] justify-between"
                    >
                    {selectedState}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                    <Command>
                    <CommandInput placeholder="Search state..." />
                    <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                        {allStates.map((state) => (
                            <CommandItem
                            key={state}
                            value={state.toLowerCase()}
                            onSelect={handleStateSelect}
                            >
                            <Check
                                className={cn(
                                'mr-2 h-4 w-4',
                                selectedState === state
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                            />
                            {state}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="all-statuses">All Statuses</SelectItem>
                        {leadStatusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          
          {shouldShowDetails ? (
             <div>
                <h2 className="text-xl font-semibold mb-4">
                    Leads with status "{selectedStatus}" in {selectedState} ({filteredLeads.length} records)
                </h2>
                 <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Lead ID</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Contact Number</TableHead>
                            <TableHead>Email</TableHead>
                             <TableHead>Date</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead, index) => (
                            <TableRow key={`${lead.leadId}-${index}`}>
                                <TableCell>{lead.leadId}</TableCell>
                                <TableCell>{lead.company}</TableCell>
                                <TableCell>{lead.contactPerson}</TableCell>
                                <TableCell>{lead.contactNumber}</TableCell>
                                <TableCell>{lead.email}</TableCell>
                                 <TableCell>{format(new Date(lead.creationDate), 'PPP')}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No leads found for this state and status.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
