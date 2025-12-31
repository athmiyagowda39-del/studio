
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, ChevronDown, ChevronUp, Search, Check, ChevronsUpDown } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LeadFormData } from './lead-upload-form';
import * as XLSX from 'xlsx';
import { ScrollArea } from '../ui/scroll-area';

type FollowUp = {
  id: number;
  date: string;
  remarks: string;
  nextFollowUp: string;
  enteredBy: string;
};

const initialFilterState = {
  search: '',
  fromSource: 'both',
  searchFor: 'company',
  fromDate: '',
  toDate: '',
  productName: 'all',
  executiveName: 'all',
  givenBy: 'all',
  statusOfLead: 'all',
  subStatusOfLead: 'all',
  leadSource: 'all',
  doNotConsider: true,
  considerFollowUps: false,
  followUpStatus: 'pending',
  followUpFromDate: '',
  followUpToDate: '',
  enterBy: 'all',
  remarksFilter: '',
};

const leadStatusOptions = [
    'Attended',
    'Not viewed',
    'Demo Given',
    'Unattended',
    'Pursuing to Purchase',
    'Not interested',
    'Order closed',
];

const executiveIds = [
    'EXEC-001',
    'EXEC-002',
    'EXEC-003',
    'EXEC-004',
    'EXEC-005',
    'EXEC-006'
];

export default function LeadUpdateForm() {
  const [searchLeadId, setSearchLeadId] = useState('');
  const [leadDetails, setLeadDetails] = useState<Partial<LeadFormData>>({});
  
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date>();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [currentStatus, setCurrentStatus] = useState('Initial');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

  const [transferredTo, setTransferredTo] = useState('');
  const [transferredToOpen, setTransferredToOpen] = useState(false);

  const [leadIdForStatus, setLeadIdForStatus] = useState('');
  const [leadIdForStatusOpen, setLeadIdForStatusOpen] = useState(false);
  const [initialRemarks, setInitialRemarks] = useState('');
  
  const [filters, setFilters] = useState(initialFilterState);

  const { toast } = useToast();

  const loadLeads = useCallback(() => {
    try {
      const storedLeads = localStorage.getItem('uploadedLeads');
      if (storedLeads) {
        const parsedLeads: LeadFormData[] = JSON.parse(storedLeads);
        const correctedLeads = parsedLeads.map((lead, index) => {
          
          let leadFollowUps: FollowUp[] = lead.followUps || [];
          if (!lead.followUps && index % 5 === 0) {
            leadFollowUps.push({
              id: 1,
              date: new Date().toLocaleDateString(),
              remarks: 'First follow up',
              nextFollowUp: format(new Date(), 'PPP'),
              enteredBy: 'Athmiya AG',
            })
          }

          return {
            ...lead,
            status: lead.status || leadStatusOptions[index % leadStatusOptions.length],
            creationDate: typeof lead.creationDate === 'string' ? new Date(lead.creationDate).getTime() : lead.creationDate,
            followUps: leadFollowUps,
            nextFollowUpDate: lead.nextFollowUpDate || (index % 3 === 0 ? new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined), // 5 days from now
          };
        });
        setAllLeads(correctedLeads as any);
      } else {
        setAllLeads([]);
      }
    } catch (error) {
      console.error('Failed to parse leads from localStorage', error);
      setAllLeads([]);
    }
  }, []);
  
  useEffect(() => {
    loadLeads();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'uploadedLeads' || event.key === null) { // event.key is null for localStorage.clear()
        loadLeads();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [loadLeads]);

  const findLeadAndSetDetails = (leadId: string) => {
     if (!leadId) {
        setLeadDetails({});
        setSearchLeadId('');
        return;
    }
    setSearchLeadId(leadId);
    const foundLead = allLeads.find(lead => lead.leadId === leadId);
    if (foundLead) {
        const leadWithViewDate: Partial<LeadFormData> = {
          ...foundLead,
          executiveViewDate: foundLead.executiveViewDate || new Date().getTime() // If not present, set to now
        };
        setLeadDetails(leadWithViewDate);
        setFollowUps((foundLead as any).followUps || []);
        setCurrentStatus((foundLead as any).status || 'Initial');
        if(foundLead.nextFollowUpDate) {
          setNextFollowUpDate(new Date(foundLead.nextFollowUpDate));
        } else {
          setNextFollowUpDate(undefined);
        }
        toast({
            title: 'Lead Loaded',
            description: `Details for ${leadId} have been loaded.`,
        });
    } else {
        setLeadDetails({});
        setFollowUps([]);
        setCurrentStatus('Initial');
        setNextFollowUpDate(undefined);
        toast({
            variant: 'destructive',
            title: 'Lead Not Found',
            description: `No lead found with ID: ${leadId}`,
        });
    }
  }

  const handleLeadDetailChange = (field: keyof LeadFormData, value: string | boolean | number | Date | undefined) => {
    setLeadDetails(prev => ({...prev, [field]: value}));
  }

  const handleAddFollowUp = () => {
    if (!remarks || !nextFollowUpDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill Remarks and Next Follow-up Date.',
      });
      return;
    }
    if (!leadDetails.leadId) {
      toast({
        variant: 'destructive',
        title: 'No Lead Loaded',
        description: 'Please load a lead before adding follow-ups.',
      });
      return;
    }

    const newFollowUp: FollowUp = {
      id: followUps.length + 1,
      date: new Date().toLocaleDateString(),
      remarks: remarks,
      nextFollowUp: format(nextFollowUpDate, 'PPP'),
      enteredBy: 'Athmiya AG', // Assuming a logged-in user
    };
    
    const updatedFollowups = [...followUps, newFollowUp];
    setFollowUps(updatedFollowups);
    
    setLeadDetails(prev => ({
      ...prev,
      followUps: updatedFollowups,
      nextFollowUpDate: nextFollowUpDate.toISOString(),
    }));

    setRemarks('');
    // We don't reset nextFollowUpDate here to allow it to be saved.
    
    toast({
        title: "Follow-up added",
        description: "Click 'Save' to persist the changes.",
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) {
      toast({
        variant: 'destructive',
        title: 'No Status Selected',
        description: 'Please select a status to update.',
      });
      return;
    }
     if (!leadIdForStatus) {
      toast({
        variant: 'destructive',
        title: 'No Lead Selected',
        description: 'Please select a lead before updating its status.',
      });
      return;
    }

    const updatedLeads = allLeads.map(lead => {
        if (lead.leadId === leadIdForStatus) {
            return {
                ...lead,
                status: selectedStatus, // Update the main status
                leadStatusRemarks: initialRemarks,
            };
        }
        return lead;
    });

    setAllLeads(updatedLeads);
    localStorage.setItem('uploadedLeads', JSON.stringify(updatedLeads));
    window.dispatchEvent(new Event('storage'));

    const leadToUpdate = updatedLeads.find(l => l.leadId === leadIdForStatus);
    if(leadToUpdate) {
        setCurrentStatus(leadToUpdate.status || 'Initial');
    }

    toast({
      title: 'Status Updated',
      description: `Lead ${leadIdForStatus} status updated to ${selectedStatus}.`,
    });
    
    // Also update the main form if the same lead is loaded
    if (leadDetails.leadId === leadIdForStatus) {
        setLeadDetails(prev => ({...prev, status: selectedStatus, leadStatusRemarks: initialRemarks}));
    }

    setInitialRemarks('');
    setSelectedStatus('');
  };

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => ({...prev, [field]: value}));
  }

  const handleShowClick = () => {
    let leads = [...allLeads];

    if (filters.search && filters.searchFor) {
        leads = leads.filter(lead => {
            const leadValue = (lead as any)[filters.searchFor];
            return leadValue?.toString().toLowerCase().includes(filters.search.toLowerCase());
        });
    }

    if (filters.fromDate) {
        const from = startOfDay(new Date(filters.fromDate)).getTime();
        leads = leads.filter(lead => (lead.creationDate || 0) >= from);
    }
    if (filters.toDate) {
        const to = startOfDay(new Date(filters.toDate)).getTime() + (24*60*60*1000 - 1); // end of day
        leads = leads.filter(lead => (lead.creationDate || 0) <= to);
    }

    if (filters.productName !== 'all') {
        leads = leads.filter(lead => lead.selectedModule === filters.productName);
    }
    
    if(filters.considerFollowUps) {
      if(filters.followUpStatus === 'pending') {
         leads = leads.filter(lead => {
          const leadWithFollowup = lead as any;
          const hasPendingFollowup = leadWithFollowup.nextFollowUpDate && new Date(leadWithFollowup.nextFollowUpDate) > new Date();
          const hasNoFollowups = !leadWithFollowup.followUps || leadWithFollowup.followUps.length === 0;
          return hasPendingFollowup || hasNoFollowups;
        });
      } else if (filters.followUpStatus === 'made') {
        leads = leads.filter(lead => (lead as any).followUps && (lead as any).followUps.length > 0);
      }
      
      if (filters.followUpFromDate) {
        const from = startOfDay(new Date(filters.followUpFromDate)).getTime();
        leads = leads.filter(lead => {
            const nextFollowUp = (lead as any).nextFollowUpDate;
            return nextFollowUp && new Date(nextFollowUp).getTime() >= from;
        });
      }

      if (filters.followUpToDate) {
        const to = startOfDay(new Date(filters.followUpToDate)).getTime() + (24*60*60*1000-1);
        leads = leads.filter(lead => {
            const nextFollowUp = (lead as any).nextFollowUpDate;
            return nextFollowUp && new Date(nextFollowUp).getTime() <= to;
        });
      }
    }
    
    setFilteredLeads(leads);
    setShowResults(true);
    setActiveQuickFilter('Search Result');
  };

  const handleResetClick = () => {
    setFilters(initialFilterState);
    setFilteredLeads([]);
    setShowResults(false);
    setActiveQuickFilter('');
  };

  const handleQuickFilter = (filterType: string) => {
    setActiveQuickFilter(filterType);
    let leads: LeadFormData[] = [];
    const today = startOfDay(new Date());

    switch(filterType) {
        case 'Recent Leads':
            const twoDaysAgo = subDays(today, 2).getTime();
            leads = allLeads.filter(lead => (lead.creationDate || 0) >= twoDaysAgo);
            break;
        case 'Leads not Viewed':
            leads = allLeads.filter(lead => !lead.executiveViewDate);
            break;
        case 'Follow Ups Due':
            const todayTimestamp = today.getTime();
            leads = allLeads.filter(lead => {
              const nextFollowUp = (lead as any).nextFollowUpDate;
              return nextFollowUp && new Date(nextFollowUp).getTime() <= todayTimestamp;
            });
            break;
        case 'Zero Follow Ups!':
            leads = allLeads.filter(lead => !(lead as any).followUps || (lead as any).followUps.length === 0);
            break;
        case 'Search Result':
            handleShowClick();
            return;
        default:
            leads = [];
    }
    
    setFilteredLeads(leads);
    setShowResults(true);
  }

  const handleToExcel = () => {
    if (filteredLeads.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No data to export',
            description: 'Please filter for some leads first.'
        });
        return;
    }
    const ws = XLSX.utils.json_to_sheet(filteredLeads);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Leads");
    XLSX.writeFile(wb, "filtered_leads.xlsx");
  }

  const summaryCards = useMemo(() => {
    const counts = leadStatusOptions.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<string, number>);

    allLeads.forEach(lead => {
      if (lead.status && counts.hasOwnProperty(lead.status)) {
        counts[lead.status]++;
      }
    });

    return {
      total: allLeads.length,
      ...counts,
    };
  }, [allLeads]);
  
  const handleResetLeadDetails = () => {
    setSearchLeadId('');
    setLeadDetails({});
    setFollowUps([]);
    setCurrentStatus('Initial');
    setNextFollowUpDate(undefined);
  };

  const handleSaveLeadDetails = () => {
    if (!leadDetails.leadId) {
      toast({
        variant: 'destructive',
        title: 'No Lead Loaded',
        description: 'Please search and load a lead before saving.',
      });
      return;
    }
    
    // Consolidate all updates before saving
    const leadToSave: Partial<LeadFormData> = {
        ...leadDetails,
        followUps: followUps, // From lead tracker
        nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.toISOString() : leadDetails.nextFollowUpDate,
    };

    if (transferredTo) {
        leadToSave.executive = transferredTo;
    }
    
    // Status from the dedicated status section
    if (leadIdForStatus === leadDetails.leadId && selectedStatus) {
        leadToSave.status = selectedStatus;
        leadToSave.leadStatusRemarks = initialRemarks;
    }


    const updatedLeads = allLeads.map(lead =>
      lead.leadId === leadToSave.leadId ? { ...lead, ...leadToSave } : lead
    );

    setAllLeads(updatedLeads);
    localStorage.setItem('uploadedLeads', JSON.stringify(updatedLeads));
    window.dispatchEvent(new Event('storage'));
    
    // Also update the currently filtered list
    setFilteredLeads(prev => prev.map(lead => lead.leadId === leadToSave.leadId ? { ...lead, ...leadToSave } : lead));

    toast({
      title: 'Lead Updated',
      description: `Lead ${leadDetails.leadId} has been successfully updated.`,
    });
  };

  const handleSelectLeadForStatus = (leadId: string) => {
      const selectedLeadId = leadId === leadIdForStatus ? '' : leadId;
      setLeadIdForStatus(selectedLeadId);
      const foundLead = allLeads.find(lead => lead.leadId === selectedLeadId);
      if (foundLead) {
          setCurrentStatus(foundLead.status || 'Initial');
      } else {
          setCurrentStatus('Initial');
      }
      setLeadIdForStatusOpen(false);
  }

  const summaryDisplay = [
    { title: 'Total Leads', value: summaryCards.total },
    { title: 'Attended', value: summaryCards.Attended },
    { title: 'Not viewed', value: summaryCards['Not viewed'] },
    { title: 'Demo Given', value: summaryCards['Demo Given'] },
    { title: 'Unattended', value: summaryCards.Unattended },
    { title: 'Pursuing to Purchase', value: summaryCards['Pursuing to Purchase'] },
    { title: 'Not interested', value: summaryCards['Not interested'] },
    { title: 'Order closed', value: summaryCards['Order closed'] },
  ];

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
        {summaryDisplay.map(item => (
            <Card key={item.title}>
                <CardHeader className="p-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <p className="text-2xl font-bold">{item.value}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">LEAD CONTACT CARD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="searchLeadId">Lead(id)</Label>
                    <Input 
                        id="searchLeadId" 
                        placeholder=""
                        value={searchLeadId}
                        readOnly
                        className="bg-muted"
                      />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact person</Label>
                  <Input id="contactPerson" value={leadDetails.contactPerson || ''} onChange={(e) => handleLeadDetailChange('contactPerson', e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" value={leadDetails.contactNumber || ''} onChange={(e) => handleLeadDetailChange('contactNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={leadDetails.address || ''} onChange={(e) => handleLeadDetailChange('address', e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="email">Email ID</Label>
                  <Input id="email" type="email" value={leadDetails.email || ''} onChange={(e) => handleLeadDetailChange('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" value={leadDetails.district || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={leadDetails.state || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfLead">Date of lead</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                            'w-full justify-start text-left font-normal',
                            !leadDetails.creationDate && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {leadDetails.creationDate ? (
                            format(new Date(leadDetails.creationDate), 'PPP')
                            ) : (
                            <span>Pick a date</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={leadDetails.creationDate ? new Date(leadDetails.creationDate) : undefined}
                            onSelect={(date) => handleLeadDetailChange('creationDate', date?.getTime())}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealerViewDate">Dealer viewed date</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {leadDetails.executiveViewDate ? (
                        format(new Date(leadDetails.executiveViewDate), 'PPP')
                    ) : (
                        <span className="text-muted-foreground">Not yet seen</span>
                    )}
                  </div>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input id="reference" value={leadDetails.reference || ''} onChange={(e) => handleLeadDetailChange('reference', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="givenBy">Given By</Label>
                  <Input id="givenBy" value={leadDetails.givenBy || ''} onChange={(e) => handleLeadDetailChange('givenBy', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executive">Executive</Label>
                  <Input id="executive" value={leadDetails.executive || ''} onChange={(e) => handleLeadDetailChange('executive', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Select 
                    value={leadDetails.selectedModule || ''} 
                    onValueChange={(value) => handleLeadDetailChange('selectedModule', value)}
                  >
                    <SelectTrigger id="module">
                      <SelectValue placeholder="Select Module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">AR</SelectItem>
                      <SelectItem value="all-hrms">All HRMS</SelectItem>
                      <SelectItem value="module1">Module 1</SelectItem>
                      <SelectItem value="module2">Module 2</SelectItem>
                      <SelectItem value="module3">Module 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Input id="manager" value={leadDetails.manager || ''} onChange={(e) => handleLeadDetailChange('manager', e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="dealer">Dealer</Label>
                  <Input id="dealer" value={leadDetails.dealer || ''} onChange={(e) => handleLeadDetailChange('dealer', e.target.value)} />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p>Dealer Member: {leadDetails.dealer || 'N/A'}</p>
                        <p>Manager: {leadDetails.manager || 'N/A'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox id="readyToUpdate" />
                            <Label htmlFor="readyToUpdate">Yes, I am Ready to Update.</Label>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <Button onClick={handleSaveLeadDetails}>Save</Button>
                        <Button variant="outline" onClick={handleResetLeadDetails}>Reset</Button>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">LEAD TRACKER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transferredLead">TRANSFERRED LEAD</Label>
                <Popover open={transferredToOpen} onOpenChange={setTransferredToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={transferredToOpen}
                      className="w-full justify-between font-normal"
                    >
                      {transferredTo || "Select Executive ID..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search executive ID..." />
                      <CommandList>
                        <CommandEmpty>No executives found.</CommandEmpty>
                        <CommandGroup>
                          {executiveIds.map((execId) => (
                            <CommandItem
                              key={execId}
                              value={execId}
                              onSelect={(currentValue) => {
                                setTransferredTo(currentValue === transferredTo ? "" : currentValue.toUpperCase());
                                setTransferredToOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  transferredTo === execId ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {execId}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="font-semibold">Follow Up</p>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Next Follow-up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !nextFollowUpDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextFollowUpDate ? (
                        format(nextFollowUpDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={nextFollowUpDate}
                      onSelect={setNextFollowUpDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">New</Button>
                <Button onClick={handleAddFollowUp}>Add&gt;&gt;</Button>
              </div>
              <div className="space-y-4 pt-4">
                <ScrollArea className="h-48 w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead>Next Follow-up</TableHead>
                        <TableHead>Entered by</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {followUps.length > 0 ? (
                        followUps.map((followUp) => (
                          <TableRow key={followUp.id}>
                            <TableCell>{followUp.id}</TableCell>
                            <TableCell>{followUp.date}</TableCell>
                            <TableCell>{followUp.remarks}</TableCell>
                            <TableCell>{followUp.nextFollowUp}</TableCell>
                            <TableCell>{followUp.enteredBy}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No follow-ups added yet.</TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader className='bg-primary/10'>
          <CardTitle className='text-primary text-base font-bold'>Lead Status</CardTitle>
        </CardHeader>
        <CardContent className='p-4 space-y-4'>
            <div className='flex flex-col gap-4'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="lead-id-status" className="shrink-0">Change Status For Lead:</Label>
                        <Popover open={leadIdForStatusOpen} onOpenChange={setLeadIdForStatusOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={leadIdForStatusOpen}
                                className="w-full justify-between font-normal"
                                >
                                {leadIdForStatus || "Select Lead..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search lead ID..." />
                                    <CommandList>
                                        <CommandEmpty>No leads found.</CommandEmpty>
                                        <CommandGroup>
                                        {allLeads.map((lead) => (
                                            <CommandItem
                                            key={lead.leadId}
                                            value={lead.leadId}
                                            onSelect={() => handleSelectLeadForStatus(lead.leadId)}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                leadIdForStatus === lead.leadId ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {lead.leadId}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="font-semibold shrink-0">Current Status: {currentStatus}</span>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={!leadIdForStatus}>
                        <SelectTrigger className="w-full min-w-[200px]">
                            <SelectValue placeholder="-- Select New Status --" />
                        </SelectTrigger>
                        <SelectContent>
                            {leadStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <Button onClick={handleUpdateStatus} disabled={!leadIdForStatus}>Update</Button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Textarea 
                        id="initial-remarks"
                        placeholder="Enter status remarks..."
                        value={initialRemarks}
                        onChange={(e) => setInitialRemarks(e.target.value)}
                        className="min-h-[40px]"
                        disabled={!leadIdForStatus}
                    />
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-6">
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Filter [{isFilterOpen ? 'hide' : 'show'}]</span>
              {isFilterOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="search">Search</Label>
                        <Input id="search" placeholder="Leave empty for all" value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label>From:</Label>
                        <RadioGroup value={filters.fromSource} onValueChange={v => handleFilterChange('fromSource', v)} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="web" id="web-update" />
                            <Label htmlFor="web-update">Web Downloads</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual-update" />
                            <Label htmlFor="manual-update">Manual Uploads</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="both-update" />
                            <Label htmlFor="both-update">Both</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    <div>
                      <RadioGroup onValueChange={v => handleFilterChange('searchFor', v)} value={filters.searchFor} className="flex flex-wrap gap-4">
                        <Label>Search for:</Label>
                        {[
                          {value: 'leadId', label: 'Lead ID'},
                          {value: 'company', label: 'Company'},
                          {value: 'contactPerson', label: 'Contact Person'},
                          {value: 'contactNumber', label: 'Phone'},
                          {value: 'district', label: 'District'},
                          {value: 'state', label: 'State'},
                          {value: 'email', label: 'Email'},
                          {value: 'manager', label: 'Manager Name'},
                        ].map((item) => (
                          <div className="flex items-center space-x-2" key={item.value}>
                            <RadioGroupItem
                              value={item.value}
                              id={`search-for-update-${item.value}`}
                            />
                            <Label htmlFor={`search-for-update-${item.value}`}>
                              {item.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="from-date-update">From Date</Label>
                        <Input id="from-date-update" type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to-date-update">To Date</Label>
                        <Input id="to-date-update" type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="product-name-update">Product Name</Label>
                        <Select value={filters.productName} onValueChange={v => handleFilterChange('productName', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">--All--</SelectItem>
                            <SelectItem value="ar">AR</SelectItem>
                            <SelectItem value="all-hrms">All HRMS</SelectItem>
                            <SelectItem value="module1">Module 1</SelectItem>
                            <SelectItem value="module2">Module 2</SelectItem>
                            <SelectItem value="module3">Module 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="executive-name-update">Executive Name</Label>
                        <Select value={filters.executiveName} onValueChange={v => handleFilterChange('executiveName', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">--All--</SelectItem>
                            <SelectItem value="exec1">Executive 1</SelectItem>
                            <SelectItem value="exec2">Executive 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="given-by-update">Given by</Label>
                        <Select value={filters.givenBy} onValueChange={v => handleFilterChange('givenBy', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">--All--</SelectItem>
                            <SelectItem value="given1">Given by 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="status-of-lead-update">Status of Lead</Label>
                        <Select value={filters.statusOfLead} onValueChange={v => handleFilterChange('statusOfLead', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">--All--</SelectItem>
                            <SelectItem value="status1">Status 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sub-status-of-lead-update">Sub Status of Lead</Label>
                        <Select value={filters.subStatusOfLead} onValueChange={v => handleFilterChange('subStatusOfLead', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">--All--</SelectItem>
                            <SelectItem value="substatus1">Sub-Status 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lead-source-update">Lead Source</Label>
                        <Select value={filters.leadSource} onValueChange={v => handleFilterChange('leadSource', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">--All--</SelectItem>
                            <SelectItem value="source1">Source 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="do-not-consider-update" checked={filters.doNotConsider} onCheckedChange={c => handleFilterChange('doNotConsider', c as boolean)} />
                      <Label htmlFor="do-not-consider-update">
                        Do not consider Order Closed/Fake/Existing Users/Not Interested
                      </Label>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center space-x-2 mb-4">
                          <Checkbox id="consider-follow-ups-update" checked={filters.considerFollowUps} onCheckedChange={c => handleFilterChange('considerFollowUps', c as boolean)} />
                          <Label htmlFor="consider-follow-ups-update">consider Follow Ups</Label>
                      </div>
                      {filters.considerFollowUps && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-4">
                                <RadioGroup value={filters.followUpStatus} onValueChange={v => handleFilterChange('followUpStatus', v)} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pending" id="pending-update" />
                                    <Label htmlFor="pending-update">Follow Up Pending</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="made" id="made-update" />
                                    <Label htmlFor="made-update">Follow Up Made</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div></div>
                            <div></div>
                            <div></div>

                            <div className="space-y-1">
                                <Label htmlFor="follow-up-from-date-update">From Date</Label>
                                <Input id="follow-up-from-date-update" type="date" value={filters.followUpFromDate} onChange={e => handleFilterChange('followUpFromDate', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="follow-up-to-date-update">To Date</Label>
                                <Input id="follow-up-to-date-update" type="date" value={filters.followUpToDate} onChange={e => handleFilterChange('followUpToDate', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="enter-by-update">Enter by</Label>
                                <Select value={filters.enterBy} onValueChange={v => handleFilterChange('enterBy', v)}>
                                    <SelectTrigger>
                                    <SelectValue placeholder="--All--" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">--All--</SelectItem>
                                        <SelectItem value="user1">User 1</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="remarks-update">Remarks</Label>
                                <Input id="remarks-update" value={filters.remarksFilter} onChange={e => handleFilterChange('remarksFilter', e.target.value)} />
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t">
                  <Button onClick={handleShowClick}>SHOW</Button>
                  <Button variant="outline" onClick={handleToExcel}>TO EXCEL</Button>
                  <Button variant="destructive" onClick={handleResetClick}>
                    RESET
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        
        {showResults && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  'Recent Leads',
                  'Leads not Viewed',
                  'Follow Ups Due',
                  'Zero Follow Ups!',
                  'Search Result',
                ].map(filterName => (
                  <Button
                    key={filterName}
                    variant={
                      activeQuickFilter === filterName
                        ? 'secondary'
                        : 'outline'
                    }
                    onClick={() => handleQuickFilter(filterName)}
                    disabled={
                      filterName === 'Search Result' &&
                      activeQuickFilter !== 'Search Result'
                    }
                  >
                    {filterName}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                List of Leads &gt;&gt; [ {activeQuickFilter} ({filteredLeads.length}{' '}
                Records) ]
              </p>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sl No</TableHead>
                      <TableHead>Lead Id</TableHead>
                      <TableHead>Lead Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Place</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Dealer</TableHead>
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
                          <TableRow key={`${lead.leadId}-${index}`} onClick={() => findLeadAndSetDetails(lead.leadId)} className="cursor-pointer">
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
                            <TableCell>{lead.district || 'N/A'}</TableCell>
                            <TableCell>{lead.state || 'N/A'}</TableCell>
                            <TableCell>{lead.reference || 'N/A'}</TableCell>
                            <TableCell>{lead.dealer || 'N/A'}</TableCell>
                            <TableCell>{lead.manager || 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.date : 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                            <TableCell>{nextFollowupDate}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.remarks : 'N/A'}</TableCell>
                            <TableCell>{lead.status || 'N/A'}</TableCell>
                            <TableCell>{lead.leadSubStatus || 'N/A'}</TableCell>
                            <TableCell>{lead.leadStatusRemarks || 'N/A'}</TableCell>
                            <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={23} className="text-center h-24">
                          No results
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="text-center mt-4">
                  <Button variant="link">
                    Show more Records &gt;&gt; (Show All Record)
                  </Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
