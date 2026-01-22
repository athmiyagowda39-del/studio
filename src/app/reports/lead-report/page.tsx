
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { format } from 'date-fns';
import AppContent from '@/components/layout/app-content';
import { useAuth } from '@/context/auth-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

const LeadStatusChart = dynamic(
  () => import('@/components/reports/lead-status-chart'),
  { ssr: false, loading: () => <div className="h-[400px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

const allStates = ["All", "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const chartLeadStatusOptions = [
    'Attended',
    'Not viewed',
    'Demo Given',
    'Unattended',
    'Pursuing to Purchase',
    'Not interested',
    'Order closed',
    'Proposal Sent',
];

const filterLeadStatusOptions = [...chartLeadStatusOptions, 'Other'];

const sectors = ['All', 'IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Retail', 'Hospitality', 'Telecommunication', 'Construction', 'Real Estate', 'Media & Entertainment', 'Government', 'Non-profit', 'Other'];
const headcounts = ['All', '1-50', '51-200', '201-500', '501-1000', '1000+'];

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};


const getLeadStatusesForFilters = (
  leads: LeadFormData[],
  state: string,
  sector: string,
  headcount: string
) => {
  const filteredLeads = leads.filter(lead => {
    let matches = true;
    if (state !== 'All') {
        matches = matches && lead.state === state;
    }
    if (sector !== 'All') {
      matches = matches && lead.sector === sector;
    }
    if (headcount !== 'All') {
      const [min, max] = headcount.replace('+', '-').split('-').map(Number);
      const leadHeadcount = parseInt(lead.headcount, 10);
      if (isNaN(leadHeadcount)) {
        matches = false;
      } else if (max) {
        matches = matches && (leadHeadcount >= min && leadHeadcount <= max);
      } else {
        matches = matches && (leadHeadcount >= min);
      }
    }
    return matches;
  });

  const statusCounts = chartLeadStatusOptions.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<string, number>);

  filteredLeads.forEach(lead => {
    if (lead.status && statusCounts.hasOwnProperty(lead.status)) {
      statusCounts[lead.status]++;
    }
  });

  const totalLeads = filteredLeads.length;

  const result = Object.entries(statusCounts).map(([status, value]) => ({ status, value }));
  result.unshift({ status: 'Total Leads', value: totalLeads });
  
  return result;
};


export default function LeadReportPage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  useEffect(() => {
    let leads = getLeadsFromLocalStorage();
    if (user?.role === 'Executive') {
      leads = leads.filter(lead => lead.executive === user.username);
    }
    setAllLeads(leads);
  }, [user]);

  const [selectedState, setSelectedState] = useState('Karnataka');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedHeadcount, setSelectedHeadcount] = useState('All');

  const [otherStatusInput, setOtherStatusInput] = useState('');
  const [otherSectorInput, setOtherSectorInput] = useState('');

  const leadStatuses = useMemo(() => {
    if (!allLeads) return [];
    return getLeadStatusesForFilters(allLeads, selectedState, selectedSector, selectedHeadcount);
  }, [allLeads, selectedState, selectedSector, selectedHeadcount]);
  
  const filteredLeads = useMemo(() => {
    if (!allLeads) return [];
    let leads = [...allLeads];
    
    if (selectedState && selectedState !== 'All') {
        leads = leads.filter(lead => lead.state === selectedState);
    }
    
    if (selectedStatus && selectedStatus !== 'all-statuses' && selectedStatus !== 'Other') {
      leads = leads.filter(lead => (lead as any).status === selectedStatus);
    }

    if (selectedSector && selectedSector !== 'All' && selectedSector !== 'Other') {
      leads = leads.filter(lead => lead.sector === selectedSector);
    }

    if (selectedHeadcount && selectedHeadcount !== 'All') {
      const [min, max] = selectedHeadcount.replace('+', '-').split('-').map(Number);
      leads = leads.filter(lead => {
        const headcount = parseInt(lead.headcount, 10);
        if (isNaN(headcount)) return false;
        if (max) {
          return headcount >= min && headcount <= max;
        }
        // For '1000+' case
        return headcount >= min;
      });
    }
    
    return leads;

  }, [selectedState, selectedStatus, selectedSector, selectedHeadcount, allLeads]);


  const chartData = useMemo(() => {
    if (!leadStatuses) return [];
    return leadStatuses
      .filter((s) => s.status !== 'Total Leads')
      .map((item) => ({
          name: item.status,
          value: item.value,
      }));
  }, [leadStatuses]);
    
  const handleStatusChange = (value: string) => {
      setSelectedStatus(value === 'all-statuses' ? '' : value);
  }

  const handleSetOtherStatus = () => {
    if (otherStatusInput.trim()) {
      setSelectedStatus(otherStatusInput.trim());
      setOtherStatusInput('');
    }
  };

  const handleSetOtherSector = () => {
    if (otherSectorInput.trim()) {
      setSelectedSector(otherSectorInput.trim());
      setOtherSectorInput('');
    }
  };

  const shouldShowDetails = selectedStatus && selectedStatus !== 'all-statuses' && selectedStatus !== 'Other';

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
        <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">Lead Report</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
            <div className="mb-6 flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Select State:</span>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-72">
                                {allStates.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <div className="flex flex-col gap-1">
                        <Select value={selectedStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-statuses">All Statuses</SelectItem>
                                {filterLeadStatusOptions.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                                {selectedStatus && !filterLeadStatusOptions.includes(selectedStatus) && selectedStatus !== '' && selectedStatus !== 'all-statuses' && (
                                    <SelectItem value={selectedStatus}>{selectedStatus}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {selectedStatus === 'Other' && (
                            <div className="mt-1 flex items-center gap-2">
                                <Input
                                    placeholder="Specify other status"
                                    value={otherStatusInput}
                                    onChange={(e) => setOtherStatusInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetOtherStatus(); }}
                                />
                                <Button size="sm" onClick={handleSetOtherStatus}>OK</Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">Sectors:</span>
                     <div className="flex flex-col gap-1">
                        <Select value={selectedSector} onValueChange={setSelectedSector}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a sector" />
                            </SelectTrigger>
                            <SelectContent>
                                {sectors.map(sector => (
                                    <SelectItem key={sector} value={sector}>
                                        {sector}
                                    </SelectItem>
                                ))}
                                 {selectedSector && !sectors.includes(selectedSector) && (
                                    <SelectItem value={selectedSector}>{selectedSector}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {selectedSector === 'Other' && (
                            <div className="mt-1 flex items-center gap-2">
                                <Input
                                    placeholder="Specify other sector"
                                    value={otherSectorInput}
                                    onChange={(e) => setOtherSectorInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetOtherSector(); }}
                                />
                                <Button size="sm" onClick={handleSetOtherSector}>OK</Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">Headcount:</span>
                    <Select value={selectedHeadcount} onValueChange={setSelectedHeadcount}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select headcount" />
                        </SelectTrigger>
                        <SelectContent>
                            {headcounts.map(count => (
                                <SelectItem key={count} value={count}>
                                    {count}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {shouldShowDetails ? (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Leads with status "{selectedStatus}" in {selectedState}: <span className="text-primary font-bold">{filteredLeads.length}</span>
                    </h2>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table className="min-w-[2900px]">
                            <TableHeader>
                            <TableRow>
                                <TableHead>Sl No</TableHead>
                                <TableHead>Lead Id</TableHead>
                                <TableHead>Lead Date</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Emailid</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>District</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Sector</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Last Followed Date</TableHead>
                                <TableHead>Last Followed By</TableHead>
                                <TableHead>Next followup Date</TableHead>
                                <TableHead>Last Followup Remarks</TableHead>
                                <TableHead>Lead Status</TableHead>
                                <TableHead>Lead Sub Status</TableHead>
                                <TableHead>Lead Status Remarks</TableHead>
                                <TableHead>Given By</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map((lead, index) => {
                                const date = new Date(lead.creationDate);
                                const isValidDate = !isNaN(date.getTime());
                                const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                                const nextFollowupDate = lead.nextFollowUpDate && !isNaN(new Date(lead.nextFollowUpDate).getTime())
                                    ? format(new Date(lead.nextFollowUpDate), 'PPP')
                                    : (lastFollowUp ? lastFollowUp.nextFollowUp : 'N/A');

                                return (
                                    <TableRow key={`${lead.leadId}-${index}`}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{lead.leadId || 'N/A'}</TableCell>
                                    <TableCell>{isValidDate ? format(date, 'PPP') : 'N/A'}</TableCell>
                                    <TableCell>{lead.selectedModule || 'N/A'}</TableCell>
                                    <TableCell>{lead.company || 'N/A'}</TableCell>
                                    <TableCell>{lead.contactPerson || 'N/A'}</TableCell>
                                    <TableCell>{lead.contactNumber || 'N/A'}</TableCell>
                                    <TableCell>{lead.email || 'N/A'}</TableCell>
                                    <TableCell>{lead.address || 'N/A'}</TableCell>
                                    <TableCell>{lead.district || 'N/A'}</TableCell>
                                    <TableCell>{lead.state || 'N/A'}</TableCell>
                                    <TableCell>{lead.reference || 'N/A'}</TableCell>
                                    <TableCell>{lead.sector || 'N/A'}</TableCell>
                                    <TableCell>{lead.manager || 'N/A'}</TableCell>
                                    <TableCell>{lastFollowUp ? lastFollowUp.date : 'N/A'}</TableCell>
                                    <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                                    <TableCell>{nextFollowupDate}</TableCell>
                                    <TableCell>{lastFollowUp ? lastFollowUp.remarks : 'N/A'}</TableCell>
                                    <TableCell>{lead.status || 'N/A'}</TableCell>
                                    <TableCell>{lead.leadSubStatus || 'N/A'}</TableCell>
                                    <TableCell>{lead.initialRemarks || 'N/A'}</TableCell>
                                    <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                                    </TableRow>
                                )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={22} className="text-center h-24">
                                        No leads found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            ) : (
                <>
                <h2 className="text-xl font-semibold mb-4">
                    Lead Status Breakdown for {selectedState}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-2">
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
                    <div className="flex justify-center items-center">
                        {chartData && chartData.length > 0 && <LeadStatusChart data={chartData} />}
                    </div>
                </div>
                </>
            )}
            </CardContent>
        </Card>
        </div>
    </AppContent>
  );
}
