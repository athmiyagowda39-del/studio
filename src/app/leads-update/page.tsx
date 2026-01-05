
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import * as XLSX from 'xlsx';
import { useAuthContext } from '@/context/auth-context';
import LeadUpdateForm from '@/components/leads/lead-update-form';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialFilterState = {
  search: '',
  fromSource: 'both',
  searchFor: 'company',
  fromDate: undefined as Date | undefined,
  toDate: undefined as Date | undefined,
  productName: 'all',
  executiveName: 'all',
  givenBy: 'all',
  statusOfLead: 'all',
  subStatusOfLead: 'all',
  leadSource: 'all',
  doNotConsider: true,
  considerFollowUps: false,
  followUpStatus: 'pending',
  followUpFromDate: undefined as Date | undefined,
  followUpToDate: undefined as Date | undefined,
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
    'Contacted',
    'Qualified',
    'Unqualified',
    'Follow-up Required',
    'Fake Lead',
    'Existing Customer',
    'Do Not Contact',
    'Quote Sent',
];

const leadSourceOptions = [
    'Website',
    'Social Media',
    'Referral',
    'Direct Call',
    'Email Campaign',
    'Advertisement',
    'Trade Show',
    'Partner',
    'Existing Customer',
    'Cold Call',
    'Other'
];

const LEADS_PER_PAGE = 10;
export default function LeadsUpdatePage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState(initialFilterState);

  const { toast } = useToast();
  const authContext = useAuthContext();


  const loadLeads = useCallback(() => {
    try {
      let storedLeads = localStorage.getItem('uploadedLeads');
      let parsedLeads: LeadFormData[] = storedLeads ? JSON.parse(storedLeads) : [];
      
      if (storedLeads) {
        const correctedLeads = parsedLeads.map((lead, index) => {
          
          let leadFollowUps: any[] = lead.followUps || [];
          if (!lead.followUps && index % 5 === 0) {
            leadFollowUps.push({
              id: 1,
              date: new Date().toLocaleDateString(),
              remarks: 'First follow up',
              nextFollowUp: format(new Date(), 'PPP'),
              enteredBy: authContext?.user?.username || 'System',
            })
          }

          return {
            ...lead,
            executive: lead.executive || (index % 2 === 0 ? 'chiranth' : 'athmiya'), // Assign some data
            status: lead.status || leadStatusOptions[index % leadStatusOptions.length],
            creationDate: typeof lead.creationDate === 'string' ? new Date(lead.creationDate).getTime() : lead.creationDate,
            followUps: leadFollowUps,
            nextFollowUpDate: lead.nextFollowUpDate || (index % 3 === 0 ? new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined), // 5 days from now
          };
        });
        
        const currentUser = authContext?.user;
        let finalLeads = correctedLeads;

        if (currentUser && currentUser.role !== 'admin') {
            finalLeads = correctedLeads.filter(lead => 
                lead.executive?.toLowerCase() === currentUser.username.toLowerCase() || 
                lead.manager?.toLowerCase() === currentUser.username.toLowerCase() ||
                lead.givenBy?.toLowerCase() === currentUser.username.toLowerCase()
            );
        }
        setAllLeads(finalLeads as any);
      } else {
        setAllLeads([]);
      }
    } catch (error) {
      console.error('Failed to parse leads from localStorage', error);
      setAllLeads([]);
    }
  }, [authContext?.user]);
  
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
    
    if (filters.statusOfLead !== 'all') {
        leads = leads.filter(lead => lead.status === filters.statusOfLead);
    }
     if (filters.leadSource !== 'all') {
        leads = leads.filter(lead => lead.reference?.toLowerCase() === filters.leadSource.toLowerCase());
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
    setCurrentPage(1);
    setShowResults(true);
    setActiveQuickFilter('Search Result');
    setSelectedLeadId(null);
  };

  const handleResetClick = () => {
    setFilters(initialFilterState);
    setFilteredLeads([]);
    setShowResults(false);
    setActiveQuickFilter('');
    setSelectedLeadId(null);
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
    setCurrentPage(1);
    setShowResults(true);
    setSelectedLeadId(null);
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

    let fileName = 'filtered_leads_report.xlsx';
    if (filters.leadSource !== 'all') {
        fileName = `${filters.leadSource.replace(/\s+/g, '_').toLowerCase()}_report.xlsx`;
    } else if (filters.statusOfLead !== 'all') {
        fileName = `${filters.statusOfLead.replace(/\s+/g, '_').toLowerCase()}_report.xlsx`;
    } else if (activeQuickFilter && activeQuickFilter !== 'Search Result') {
        fileName = `${activeQuickFilter.replace(/\s+/g, '_').toLowerCase()}_report.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(filteredLeads);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Leads");
    XLSX.writeFile(wb, fileName);
  }

  const summaryCards = useMemo(() => {
    const counts: Record<string, number> = {
      'Total Leads': allLeads.length,
      'Attended': 0,
      'Not viewed': 0,
      'Demo Given': 0,
      'Unattended': 0,
      'Pursuing to Purchase': 0,
      'Not interested': 0,
      'Order closed': 0,
    };
  
    allLeads.forEach(lead => {
      if (lead.status && counts.hasOwnProperty(lead.status)) {
        counts[lead.status]++;
      }
    });
  
    return counts;
  }, [allLeads]);

  const summaryDisplay = [
    { title: 'Total Leads', value: summaryCards['Total Leads'] },
    { title: 'Attended', value: summaryCards.Attended },
    { title: 'Not viewed', value: summaryCards['Not viewed'] },
    { title: 'Demo Given', value: summaryCards['Demo Given'] },
    { title: 'Unattended', value: summaryCards.Unattended },
    { title: 'Pursuing to Purchase', value: summaryCards['Pursuing to Purchase'] },
    { title: 'Not interested', value: summaryCards['Not interested'] },
    { title: 'Order closed', value: summaryCards['Order closed'] },
  ];

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  const handleRowClick = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const selectedLeadDetails = useMemo(() => {
    if (!selectedLeadId) return null;
    return allLeads.find(lead => lead.leadId === selectedLeadId);
  }, [selectedLeadId, allLeads]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">UPDATE LEADS</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
           <div className="space-y-4">
        
             <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-around gap-x-4 gap-y-2">
                    {summaryDisplay.map(item => (
                      <div key={item.title} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">{item.title}:</span>
                        <span className="font-bold text-primary">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            <LeadUpdateForm leadId={selectedLeadId} onUpdate={loadLeads} />

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
                <div className="p-4 space-y-4">
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !filters.fromDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.fromDate ? (
                                format(filters.fromDate, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={filters.fromDate}
                              onSelect={(date) => handleFilterChange('fromDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to-date-update">To Date</Label>
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !filters.toDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.toDate ? (
                                format(filters.toDate, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={filters.toDate}
                              onSelect={(date) => handleFilterChange('toDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                            {leadStatusOptions.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
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
                            <ScrollArea className="h-48">
                                <SelectItem value="all">--All--</SelectItem>
                                {leadSourceOptions.map(source => (
                                    <SelectItem key={source} value={source}>
                                        {source}
                                    </SelectItem>
                                ))}
                            </ScrollArea>
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
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !filters.followUpFromDate && 'text-muted-foreground'
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {filters.followUpFromDate ? (
                                        format(filters.followUpFromDate, 'PPP')
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={filters.followUpFromDate}
                                      onSelect={(date) => handleFilterChange('followUpFromDate', date)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="follow-up-to-date-update">To Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !filters.followUpToDate && 'text-muted-foreground'
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {filters.followUpToDate ? (
                                        format(filters.followUpToDate, 'PPP')
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={filters.followUpToDate}
                                      onSelect={(date) => handleFilterChange('followUpToDate', date)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
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
            <CardHeader>
              <CardTitle className='text-base'>
                List of Leads &gt;&gt; [ {activeQuickFilter} ({filteredLeads.length}{' '} Records) ]
              </CardTitle>
            </CardHeader>
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
              <Card>
                <CardContent className="p-0">
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-max">
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
                          {paginatedLeads.length > 0 ? (
                          paginatedLeads.map((lead, index) => {
                              const date = new Date(lead.creationDate);
                              const isValidDate = !isNaN(date.getTime());
                              const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                              const nextFollowupDate = lead.nextFollowUpDate && !isNaN(new Date(lead.nextFollowUpDate).getTime())
                              ? format(new Date(lead.nextFollowUpDate), 'PPP')
                              : (lastFollowUp ? lastFollowUp.nextFollowUp : 'N/A');
                              const absoluteIndex = (currentPage - 1) * LEADS_PER_PAGE + index + 1;

                              return (
                              <TableRow key={`${lead.leadId}-${index}`} onClick={() => handleRowClick(lead.leadId)} className="cursor-pointer">
                                  <TableCell>{absoluteIndex}</TableCell>
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
                                  <TableCell>{lead.givenBy || 'N_A'}</TableCell>
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
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
        </CardContent>
      </Card>
    </div>
  );
}
