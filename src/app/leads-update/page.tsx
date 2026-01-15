'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
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
import LeadUpdateForm from '@/components/leads/lead-update-form';
import AppContent from '@/components/layout/app-content';
import { format, startOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsers } from '@/context/users-context';
import { useAuth } from '@/context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


/* ---------------- CONSTANTS ---------------- */

const LEADS_PER_PAGE = 10;
type TabValue = 'recent' | 'not-viewed' | 'follow-ups-due' | 'zero-follow-ups' | 'search-result';

const leadSources = [
    "Website", "Social Media", "Google Ads", "Facebook Ads", "LinkedIn", "Referral", "Cold Call",
    "Email Campaign", "WhatsApp Campaign", "Walk-in", "Telecalling", "Events / Trade Shows", "Webinars",
    "Channel Partner", "Reseller", "Distributor", "Existing Customer", "Upselling", "Cross-selling",
    "Marketplace (Justdial / IndiaMART)", "Third-party Data", "Outdoor Marketing", "Newspaper Ads",
    "TV / Radio Ads", "Direct Sales", "Field Sales", "Franchise", "Customer Support", "Demo Request", "Trial Signup", "Job Portal"
];

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
    'Proposal Sent',
];

const leadSubStatusOptions = [
    'pricing issue',
    'other',
    'requirement doesnot match',
    'Budget not available',
    'Price too high',
    'Not the right time',
    'No current requirement',
    'Already using another product',
    'Satisfied with existing vendor',
    'Requirement already fulfilled',
    'Features not matching',
    'Product not relevant',
    'Need management approval',
    'Not the decision maker',
    'Project postponed',
    'Just exploring',
    'Only for information',
    'Not convinced',
    'Competitor offering better deal',
    'Contract already signed',
    'Support concerns',
    'Quality concerns',
    'Integration issues',
    'Customization not available',
    'Service not available in location',
    'Delivery issues',
    'Not reachable',
    'Not responding',
    'Call back later',
    'Wrong contact details',
    'Busy now',
    'Language barrier',
    'Business closed',
];


/* ---------------- HELPERS ---------------- */

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('allLeads');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

/* ---------------- COMPONENT ---------------- */

export default function LeadsUpdatePage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // ✅ FILTER TOGGLE
  const [showFilters, setShowFilters] = useState(false);
  const [considerStatus, setConsiderStatus] = useState(false);

  // ✅ FILTER STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('leadId');
  const [activeTab, setActiveTab] = useState<TabValue>('recent');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [selectedLeadSource, setSelectedLeadSource] = useState('');
  const [leadSourceOpen, setLeadSourceOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [givenBy, setGivenBy] = useState('');


  /* ---------------- EFFECT ---------------- */
  const { users } = useUsers();
  const { user } = useAuth();
  const [executives, setExecutives] = useState<string[]>([]);

  useEffect(() => {
    const executiveUsers = users
      .filter(user => user.role === 'Executive')
      .map(user => user.username);
    setExecutives(executiveUsers);
  }, [users]);

  useEffect(() => {
    let leads = getLeadsFromLocalStorage();
    if (user?.role === 'Executive') {
      leads = leads.filter(lead => lead.executive === user.username);
    }
    setAllLeads(leads);
    setFilteredLeads(leads);
  }, [user]);

  const handleLeadsUpdate = (updatedLeads: LeadFormData[]) => {
    let leadsToUpdate = updatedLeads;
    if (user?.role === 'Executive') {
        leadsToUpdate = leadsToUpdate.filter(lead => lead.executive === user.username);
    }
    setAllLeads(leadsToUpdate);
    // Re-apply filters and tabs after update
    handleFilterAndTab(leadsToUpdate, activeTab, true);
  };
  
  const handleFilterAndTab = (
    sourceLeads: LeadFormData[],
    tab: TabValue,
    isSearchResult: boolean = false
  ) => {
    let tempLeads = [...sourceLeads];

    if (isSearchResult) {
      if (searchTerm.trim() !== '') {
        tempLeads = tempLeads.filter(lead => {
          const leadValue = (lead[searchCategory as keyof LeadFormData] as string)?.toString().toLowerCase() || '';
          return leadValue.startsWith(searchTerm.toLowerCase());
        });
      }
    }

    if (selectedExecutive !== 'all') {
        tempLeads = tempLeads.filter(lead => lead.executive === selectedExecutive);
    }

    if (selectedLeadSource) {
        tempLeads = tempLeads.filter(lead => lead.reference === selectedLeadSource);
    }

    if (selectedProduct !== 'all') {
        tempLeads = tempLeads.filter(lead => lead.selectedModule === selectedProduct);
    }
    
    if (givenBy.trim() !== '') {
        tempLeads = tempLeads.filter(lead => 
            lead.givenBy?.toLowerCase().includes(givenBy.toLowerCase())
        );
    }

    switch (tab) {
        case 'not-viewed':
            tempLeads = tempLeads.filter(lead => !lead.executiveViewDate);
            break;
        case 'follow-ups-due':
            const today = startOfDay(new Date());
            tempLeads = tempLeads.filter(lead => {
                if (!lead.nextFollowUpDate) return false;
                const dueDate = startOfDay(new Date(lead.nextFollowUpDate));
                return dueDate <= today;
            });
            break;
        case 'zero-follow-ups':
            tempLeads = tempLeads.filter(lead => !lead.followUps || lead.followUps.length === 0);
            break;
        case 'search-result':
            // The search filter is already applied above
            break;
        case 'recent':
        default:
            // No extra filtering needed for 'recent'
            break;
    }

    setFilteredLeads(tempLeads);
    setCurrentPage(1); // Reset to first page after filtering
  };

  useEffect(() => {
    handleFilterAndTab(allLeads, activeTab, activeTab === 'search-result');
  }, [activeTab, allLeads, selectedExecutive, selectedLeadSource, selectedProduct, givenBy]);

  const handleShowButtonClick = () => {
    setActiveTab('search-result');
    handleFilterAndTab(allLeads, 'search-result', true);
  };


  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchCategory('leadId');
    setActiveTab('recent');
    setSelectedExecutive('all');
    setSelectedLeadSource('');
    setSelectedProduct('all');
    setGivenBy('');
    setFilteredLeads(allLeads);
    setCurrentPage(1);
  };


  /* ---------------- PAGINATION ---------------- */

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(start, start + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  /* ---------------- UI ---------------- */

  return (
    <AppContent>
      <div className="flex flex-col gap-6">

        {/* PAGE CARD */}
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              UPDATE LEADS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            {/* LEAD STATUS */}
            <LeadUpdateForm
              leadId={selectedLeadId}
              allLeads={allLeads}
              setAllLeads={handleLeadsUpdate}
            />

            {/* ================= FILTER TOGGLE (CLICK ANYWHERE) ================= */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowFilters(prev => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowFilters(prev => !prev);
                }
              }}
              className="
                flex items-center justify-between
                bg-muted px-4 py-3
                rounded-md
                cursor-pointer
                select-none
                hover:bg-muted/80
                transition
              "
            >
              <span className="font-medium">
                Filter [{showFilters ? 'hide' : 'show'}]
              </span>
              <span className="text-sm">
                {showFilters ? '▲' : '▼'}
              </span>
            </div>

            {/* ================= FILTER PANEL ================= */}
            {showFilters && (
              <Card>
                <CardContent className="p-4 space-y-4">

                  {/* ROW 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="search" className="font-medium">Search</Label>
                        <Input 
                          id="search" 
                          placeholder="Leave empty for all" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="font-medium">From:</Label>
                        <RadioGroup defaultValue="both" className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="web" /> Web Downloads
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="manual" /> Manual Uploads
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="both" /> Both
                          </div>
                        </RadioGroup>
                    </div>
                  </div>

                  {/* ROW 2 */}
                  <div className="flex items-center gap-4">
                    <Label className="font-medium shrink-0">Search for:</Label>
                    <RadioGroup 
                        value={searchCategory}
                        onValueChange={setSearchCategory}
                        className="flex flex-wrap gap-4"
                    >
                      {[
                        {label: 'Lead ID', value: 'leadId'}, 
                        {label: 'Company', value: 'company'}, 
                        {label: 'Contact Person', value: 'contactPerson'}, 
                        {label: 'Phone', value: 'contactNumber'}, 
                        {label: 'District', value: 'district'}, 
                        {label: 'State', value: 'state'}, 
                        {label: 'Email', value: 'email'}, 
                        {label: 'Manager Name', value: 'manager'}
                      ].map(item => (
                        <div key={item.value} className="flex items-center gap-2">
                          <RadioGroupItem value={item.value} id={item.value} /> 
                          <Label htmlFor={item.value}>{item.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* ROW 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label>From Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-1">
                      <Label>To Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-1">
                      <Label>Product Name</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger><SelectValue placeholder="--All--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="all-hrms">All HRMS</SelectItem>
                          <SelectItem value="module1">Module 1</SelectItem>
                          <SelectItem value="module2">Module 2</SelectItem>
                          <SelectItem value="module3">Module 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Executive Name</Label>
                      <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                        <SelectTrigger><SelectValue placeholder="--All--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                           {executives.map(exec => (
                            <SelectItem key={exec} value={exec}>
                              {exec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ROW 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="givenBy">Given by</Label>
                      <Input 
                        id="givenBy"
                        placeholder="--All--"
                        value={givenBy}
                        onChange={(e) => setGivenBy(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Status of Lead</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="--All--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                           {leadStatusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Sub Status of Lead</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="--All--" /></SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-48">
                                <SelectItem value="all">All</SelectItem>
                                {leadSubStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Lead Source</Label>
                      <Popover open={leadSourceOpen} onOpenChange={setLeadSourceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={leadSourceOpen}
                            className="w-full justify-between font-normal"
                          >
                            {selectedLeadSource || "--All--"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search lead source..." />
                                <CommandList>
                                <CommandEmpty>No lead source found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                    <CommandItem
                                        value=""
                                        onSelect={() => {
                                            setSelectedLeadSource('');
                                            setLeadSourceOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", !selectedLeadSource ? "opacity-100" : "opacity-0")}/>
                                        --All--
                                    </CommandItem>
                                    {leadSources.map((source) => (
                                    <CommandItem
                                        key={source}
                                        value={source}
                                        onSelect={(currentValue) => {
                                            const sourceValue = leadSources.find(s => s.toLowerCase() === currentValue);
                                            setSelectedLeadSource(sourceValue === selectedLeadSource ? "" : sourceValue || "");
                                            setLeadSourceOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", selectedLeadSource === source ? "opacity-100" : "opacity-0")}/>
                                        {source}
                                    </CommandItem>
                                    ))}
                                    </ScrollArea>
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* ROW 5 */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={considerStatus}
                      onCheckedChange={(checked) => setConsiderStatus(checked as boolean)}
                    /> Do not consider Order Closed/Fake/Existing Users/Not Interested
                  </div>

                  {/* CONDITIONAL ROWS */}
                  {considerStatus && (
                    <>
                      {/* ROW 6 */}
                      <RadioGroup defaultValue="pending" className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="pending" /> Follow Up Pending
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="made" /> Follow Up Made
                        </div>
                      </RadioGroup>

                      {/* ROW 7 */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input type="date" />
                        <Input type="date" />
                        <Select><SelectTrigger><SelectValue placeholder="Entered By" /></SelectTrigger></Select>
                        <Input placeholder="Remarks" />
                      </div>
                    </>
                  )}


                  {/* ACTION BUTTONS */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button onClick={handleShowButtonClick}>SHOW</Button>
                    <Button variant="secondary">TO EXCEL</Button>
                    <Button variant="destructive" onClick={handleResetFilters}>RESET</Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* ================= TABLE ================= */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
                  <TabsList>
                    <TabsTrigger value="recent">Recent Leads</TabsTrigger>
                    <TabsTrigger value="not-viewed">Leads not Viewed</TabsTrigger>
                    <TabsTrigger value="follow-ups-due">Follow Ups Due</TabsTrigger>
                    <TabsTrigger value="zero-follow-ups">Zero Follow Ups!</TabsTrigger>
                    <TabsTrigger value="search-result">Search Result</TabsTrigger>
                  </TabsList>
                </Tabs>
                <CardHeader className="p-0 pt-4">
                  <CardTitle className="text-base">
                    List of Leads &gt;&gt; [All Leads ({filteredLeads.length} Records)]
                  </CardTitle>
                </CardHeader>
                <div className="w-full overflow-x-auto border rounded-md">
                  <Table className="min-w-[2800px]">
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Lead Id</TableHead>
                        <TableHead>Lead Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Cell</TableHead>
                        <TableHead>Emailid</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Place</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Last Followed Date</TableHead>
                        <TableHead>Last Followed By</TableHead>
                        <TableHead>Next followup Date</TableHead>
                        <TableHead>Last Followup Remarks</TableHead>
                        <TableHead>Lead Status</TableHead>
                        <TableHead>Lead Sub Status</TableHead>
                        <TableHead>Lead Status Remarks</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedLeads.map((lead, index) => {
                        const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                        const nextFollowupDate =
                          lead.status === 'Order closed'
                            ? 'N/A'
                            : lead.nextFollowUpDate && !isNaN(new Date(lead.nextFollowUpDate).getTime())
                            ? format(new Date(lead.nextFollowUpDate), 'PPP')
                            : lastFollowUp
                            ? lastFollowUp.nextFollowUp
                            : 'N/A';

                        return (
                        <TableRow 
                          key={lead.leadId} 
                          onClick={() => setSelectedLeadId(lead.leadId)} 
                          className="cursor-pointer"
                        >
                          <TableCell>{(currentPage - 1) * LEADS_PER_PAGE + index + 1}</TableCell>
                          <TableCell>{lead.leadId}</TableCell>
                          <TableCell>{format(new Date(lead.creationDate), 'PPP')}</TableCell>
                          <TableCell>{lead.selectedModule}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.contactPerson}</TableCell>
                          <TableCell>{lead.contactNumber}</TableCell>
                          <TableCell>{lead.contactNumber}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.address}</TableCell>
                          <TableCell>{lead.district}</TableCell>
                          <TableCell>{lead.district}</TableCell>
                          <TableCell>{lead.state}</TableCell>
                          <TableCell>{lead.reference}</TableCell>
                          <TableCell>{lead.executive}</TableCell>
                          <TableCell>{lead.manager}</TableCell>
                          <TableCell>{lastFollowUp ? lastFollowUp.date : 'N/A'}</TableCell>
                          <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                          <TableCell>{nextFollowupDate}</TableCell>
                          <TableCell>{lastFollowUp ? lastFollowUp.remarks : 'N/A'}</TableCell>
                          <TableCell>{lead.status}</TableCell>
                          <TableCell>{lead.leadSubStatus}</TableCell>
                          <TableCell>{lead.initialRemarks}</TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </div>
                 {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-end gap-2 p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Previous
                    </Button>

                    <span className="self-center text-sm">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
