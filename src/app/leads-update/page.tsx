
'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo, useRef } from 'react';
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
import { format, startOfDay, endOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsers } from '@/context/users-context';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';


/* ---------------- CONSTANTS ---------------- */

const LEADS_PER_PAGE = 10;
type TabValue = 'recent' | 'not-viewed' | 'follow-ups-due' | 'zero-follow-ups' | 'search-result';

const leadSubStatusOptions = [
    'All',
    'pricing issue',
    'requirement doesnot match',
    'Already using another product',
    'Not the decision maker',
    'Just exploring',
    'Competitor offering better deal',
    'Contract already signed',
    'Service not available in location',
    'Wrong contact details',
    'Business closed',
    'Other',
];

const references = [
    "All", "Website", "Social Media", "Google Ads", "Facebook Ads", "LinkedIn", "Referral", "Cold Call",
    "Telecalling", "Walk-in", "Email Campaign", "WhatsApp Campaign", "IndiaMART", "Channel Partner",
    "Existing Customer", "Upselling", "Cross-selling", "Events / Trade Shows", "Demo Request", "Trial Signup", "Other"
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pageTopRef = useRef<HTMLDivElement>(null);

  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // ✅ FILTER TOGGLE
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ MAIN FILTER STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('leadId');
  const [activeTab, setActiveTab] = useState<TabValue>('recent');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [otherExecutiveInput, setOtherExecutiveInput] = useState('');
  
  const [selectedLeadSource, setSelectedLeadSource] = useState('all');
  const [otherLeadSourceInput, setOtherLeadSourceInput] = useState('');

  const [selectedProduct, setSelectedProduct] = useState('all');
  const [givenBy, setGivenBy] = useState('all');
  const [otherGivenByInput, setOtherGivenByInput] = useState('');

  const [selectedSubStatus, setSelectedSubStatus] = useState('all');
  const [otherSubStatusInput, setOtherSubStatusInput] = useState('');

  // ✅ FOLLOW-UP FILTER STATE
  const [considerStatus, setConsiderStatus] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState('pending');
  const [followUpFromDate, setFollowUpFromDate] = useState('');
  const [followUpToDate, setFollowUpToDate] = useState('');
  const [followUpGivenBy, setFollowUpGivenBy] = useState('all');
  const [otherFollowUpGivenByInput, setOtherFollowUpGivenByInput] = useState('');


  /* ---------------- EFFECT ---------------- */
  const { users } = useUsers();
  const [executives, setExecutives] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const executiveUsers = users
      .filter(user => user.role === 'Executive')
      .map(user => user.username);
    setExecutives(executiveUsers);
  }, [users]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadLeads = () => {
        let leads = getLeadsFromLocalStorage();
        if (user?.role === 'Executive') {
          leads = leads.filter(lead => lead.executive === user.username);
        } else if (user?.role === 'Sub Admin') {
            // Future logic for Sub Admins can go here
        }
        setAllLeads(leads);
      };

      loadLeads(); // Initial load

      // Listen for changes in local storage from other tabs/windows
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'allLeads') {
            loadLeads();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [user, isAuthenticated]);


  const handleLeadsUpdate = (updatedLeads: LeadFormData[]) => {
    let leadsToUpdate = updatedLeads;
    if (user?.role === 'Executive') {
        leadsToUpdate = updatedLeads.filter(lead => lead.executive === user.username);
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

    if (selectedExecutive !== 'all' && selectedExecutive !== 'Other') {
        tempLeads = tempLeads.filter(lead => lead.executive === selectedExecutive);
    }

    if (selectedLeadSource !== 'all' && selectedLeadSource !== 'Other') {
        tempLeads = tempLeads.filter(lead => lead.reference === selectedLeadSource);
    }

    if (selectedProduct !== 'all') {
        tempLeads = tempLeads.filter(lead => lead.selectedModule === selectedProduct);
    }
    
    if (givenBy !== 'all' && givenBy !== 'Other') {
        tempLeads = tempLeads.filter(lead => lead.givenBy === givenBy);
    }

    if (selectedSubStatus !== 'all' && selectedSubStatus !== 'Other') {
        tempLeads = tempLeads.filter(lead => lead.leadSubStatus === selectedSubStatus);
    }
    
    if (considerStatus) {
        const excludedStatuses = ['Order closed', 'Fake', 'Existing Users', 'Not interested'];
        tempLeads = tempLeads.filter(lead => !excludedStatuses.includes(lead.status || ''));
        
        if (followUpStatus === 'pending') {
            tempLeads = tempLeads.filter(lead => {
                if (!lead.nextFollowUpDate) return false;
                try {
                    const nextFollowUp = startOfDay(new Date(lead.nextFollowUpDate));
                    let inDateRange = true;
                    if (followUpFromDate) {
                        inDateRange = inDateRange && nextFollowUp >= startOfDay(new Date(followUpFromDate));
                    }
                    if (followUpToDate) {
                        inDateRange = inDateRange && nextFollowUp <= endOfDay(new Date(followUpToDate));
                    }
                    return inDateRange;
                } catch(e) {
                    return false;
                }
            });
        } else if (followUpStatus === 'made') {
            tempLeads = tempLeads.filter(lead => {
                if (!lead.followUps || lead.followUps.length === 0) return false;

                return lead.followUps.some(followUp => {
                    let isMatch = true;
                    try {
                        const followUpDate = startOfDay(new Date(followUp.date));
                        let inDateRange = true;
                        if (followUpFromDate) {
                            inDateRange = inDateRange && followUpDate >= startOfDay(new Date(followUpFromDate));
                        }
                        if (followUpToDate) {
                            inDateRange = inDateRange && followUpDate <= endOfDay(new Date(followUpToDate));
                        }
                        if (!inDateRange) isMatch = false;
                    } catch(e) {
                        isMatch = false;
                    }

                    if (followUpGivenBy !== 'all' && followUpGivenBy !== 'Other' && followUp.enteredBy !== followUpGivenBy) {
                        isMatch = false;
                    }

                    return isMatch;
                });
            });
        }
    }


    switch (tab) {
        case 'not-viewed':
            tempLeads = tempLeads.filter(lead => !lead.executiveViewDate);
            break;
        case 'follow-ups-due':
            const today = startOfDay(new Date());
            tempLeads = tempLeads.filter(lead => {
                if (!lead.nextFollowUpDate) return false;
                try {
                  const dueDate = startOfDay(new Date(lead.nextFollowUpDate));
                  return dueDate <= today;
                } catch {
                  return false;
                }
            });
            tempLeads.sort((a, b) => 
                (a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : 0) - 
                (b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : 0)
            );
            break;
        case 'zero-follow-ups':
            tempLeads = tempLeads.filter(lead => !lead.followUps || lead.followUps.length === 0);
            break;
        case 'search-result':
            break;
        case 'recent':
        default:
            tempLeads.sort((a,b) => b.creationDate - a.creationDate);
            break;
    }

    setFilteredLeads(tempLeads);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleFilterAndTab(allLeads, activeTab, activeTab === 'search-result');
  }, [
    activeTab, 
    allLeads, 
    selectedExecutive, 
    selectedLeadSource, 
    selectedProduct, 
    givenBy,
    selectedSubStatus,
    considerStatus,
    followUpStatus,
    followUpFromDate,
    followUpToDate,
    followUpGivenBy,
  ]);

  const handleShowButtonClick = () => {
    setActiveTab('search-result');
    handleFilterAndTab(allLeads, 'search-result', true);
  };


  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchCategory('leadId');
    setActiveTab('recent');
    setSelectedExecutive('all');
    setOtherExecutiveInput('');
    setSelectedLeadSource('all');
    setOtherLeadSourceInput('');
    setSelectedProduct('all');
    setGivenBy('all');
    setOtherGivenByInput('');
    setSelectedSubStatus('all');
    setOtherSubStatusInput('');
    
    setConsiderStatus(false);
    setFollowUpStatus('pending');
    setFollowUpFromDate('');
    setFollowUpToDate('');
    setFollowUpGivenBy('all');
    setOtherFollowUpGivenByInput('');

    setFilteredLeads(allLeads);
    setCurrentPage(1);
  };
  
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const handleSetOtherExecutive = () => {
    if(otherExecutiveInput.trim()){
      const newExec = otherExecutiveInput.trim();
      setSelectedExecutive(newExec);
      setOtherExecutiveInput('');
    }
  };

  const handleSetOtherLeadSource = () => {
    if(otherLeadSourceInput.trim()){
      const newSource = otherLeadSourceInput.trim();
      setSelectedLeadSource(newSource);
      setOtherLeadSourceInput('');
    }
  };

  const handleSetOtherGivenBy = () => {
    if (otherGivenByInput.trim()) {
      const newGivenBy = otherGivenByInput.trim();
      setGivenBy(newGivenBy);
      setOtherGivenByInput('');
    }
  };

  const handleSetOtherSubStatus = () => {
    if(otherSubStatusInput.trim()){
      const newStatus = otherSubStatusInput.trim();
      setSelectedSubStatus(newStatus);
      setOtherSubStatusInput('');
    }
  };

  const handleSetOtherFollowUpGivenBy = () => {
    if(otherFollowUpGivenByInput.trim()){
      const newGivenBy = otherFollowUpGivenByInput.trim();
      setFollowUpGivenBy(newGivenBy);
      setOtherFollowUpGivenByInput('');
    }
  };


  /* ---------------- PAGINATION ---------------- */

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(start, start + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  /* ---------------- UI ---------------- */
  if (isLoading || !isAuthenticated) {
    return null; // or a loading skeleton
  }

  return (
    <AppContent>
      <div className="flex flex-col gap-6" ref={pageTopRef}>

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
                      <Label htmlFor="givenBy">Given by</Label>
                       <Select value={givenBy} onValueChange={(value) => setGivenBy(value)}>
                        <SelectTrigger id="givenBy">
                          <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {executives.map((exec) => (
                            <SelectItem key={exec} value={exec}>
                              {exec}
                            </SelectItem>
                          ))}
                          {!executives.includes(givenBy) && givenBy !== 'all' && givenBy !== 'Other' && (
                              <SelectItem value={givenBy}>{givenBy}</SelectItem>
                          )}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {givenBy === 'Other' && (
                        <div className="mt-2">
                           <div className="flex items-center gap-2">
                              <Input
                                placeholder="Specify who gave it"
                                value={otherGivenByInput}
                                onChange={(e) => setOtherGivenByInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSetOtherGivenBy();
                                }}
                              />
                              <Button size="sm" onClick={handleSetOtherGivenBy}>OK</Button>
                            </div>
                        </div>
                      )}
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
                  </div>

                  {/* ROW 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1">
                      <Label>Executive Name</Label>
                      <Select value={selectedExecutive} onValueChange={(value) => setSelectedExecutive(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                           {executives.map(exec => (
                            <SelectItem key={exec} value={exec}>
                              {exec}
                            </SelectItem>
                          ))}
                          {!executives.includes(selectedExecutive) && selectedExecutive !== 'all' && selectedExecutive !== 'Other' && (
                              <SelectItem value={selectedExecutive}>{selectedExecutive}</SelectItem>
                          )}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedExecutive === 'Other' && (
                        <div className="mt-2">
                           <div className="flex items-center gap-2">
                              <Input
                                placeholder="Specify other executive"
                                value={otherExecutiveInput}
                                onChange={(e) => setOtherExecutiveInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSetOtherExecutive();
                                }}
                              />
                              <Button size="sm" onClick={handleSetOtherExecutive}>OK</Button>
                            </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Sub Status of Lead</Label>
                      <Select value={selectedSubStatus} onValueChange={(value) => setSelectedSubStatus(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-48">
                                {leadSubStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                                ))}
                                {!leadSubStatusOptions.includes(selectedSubStatus) && selectedSubStatus !== 'all' && selectedSubStatus !== 'Other' && (
                                    <SelectItem value={selectedSubStatus}>{selectedSubStatus}</SelectItem>
                                )}
                            </ScrollArea>
                        </SelectContent>
                      </Select>
                       {selectedSubStatus === 'Other' && (
                        <div className="mt-2">
                           <div className="flex items-center gap-2">
                              <Input
                                placeholder="Specify other reason"
                                value={otherSubStatusInput}
                                onChange={(e) => setOtherSubStatusInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSetOtherSubStatus();
                                }}
                              />
                              <Button size="sm" onClick={handleSetOtherSubStatus}>OK</Button>
                            </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="leadSource">Lead Source</Label>
                      <Select value={selectedLeadSource} onValueChange={(value) => setSelectedLeadSource(value)}>
                        <SelectTrigger id="leadSource">
                          <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                          {references.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                          {!references.includes(selectedLeadSource) && selectedLeadSource !== 'all' && selectedLeadSource !== 'Other' && (
                            <SelectItem value={selectedLeadSource}>{selectedLeadSource}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedLeadSource === 'Other' && (
                        <div className="mt-2">
                            <div className="flex items-center gap-2">
                                <Input
                                placeholder="Specify other source"
                                value={otherLeadSourceInput}
                                onChange={(e) => setOtherLeadSourceInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSetOtherLeadSource();
                                }}
                                />
                                <Button size="sm" onClick={handleSetOtherLeadSource}>OK</Button>
                            </div>
                        </div>
                      )}
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
                      <RadioGroup value={followUpStatus} onValueChange={setFollowUpStatus} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="pending" id="pending" />
                          <Label htmlFor="pending">Follow Up Pending</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="made" id="made" />
                           <Label htmlFor="made">Follow Up Made</Label>
                        </div>
                      </RadioGroup>

                      {/* ROW 7 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label>From Date</Label>
                            <Input type="date" value={followUpFromDate} onChange={(e) => setFollowUpFromDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>To Date</Label>
                            <Input type="date" value={followUpToDate} onChange={(e) => setFollowUpToDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="givenByFollowUp">Given by</Label>
                            <Select value={followUpGivenBy} onValueChange={(value) => setFollowUpGivenBy(value)}>
                                <SelectTrigger id="givenByFollowUp">
                                    <SelectValue placeholder="--All--" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {executives.map((exec) => (
                                    <SelectItem key={exec} value={exec}>
                                        {exec}
                                    </SelectItem>
                                    ))}
                                    {!executives.includes(followUpGivenBy) && followUpGivenBy !== 'all' && followUpGivenBy !== 'Other' && (
                                        <SelectItem value={followUpGivenBy}>{followUpGivenBy}</SelectItem>
                                    )}
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {followUpGivenBy === 'Other' && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Specify who gave it"
                                            value={otherFollowUpGivenByInput}
                                            onChange={(e) => setOtherFollowUpGivenByInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSetOtherFollowUpGivenBy();
                                            }}
                                        />
                                        <Button size="sm" onClick={handleSetOtherFollowUpGivenBy}>OK</Button>
                                    </div>
                                </div>
                            )}
                        </div>
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
                <div className="w-full overflow-x-auto rounded-md border">
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
                          onClick={() => handleSelectLead(lead.leadId)} 
                          className="cursor-pointer"
                        >
                          <TableCell>{(currentPage - 1) * LEADS_PER_PAGE + index + 1}</TableCell>
                          <TableCell>{lead.leadId}</TableCell>
                          <TableCell>{format(new Date(lead.creationDate), 'PPP')}</TableCell>
                          <TableCell>{lead.selectedModule}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.contactPerson}</TableCell>
                          <TableCell>{lead.contactNumber}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.address}</TableCell>
                          <TableCell>{lead.district}</TableCell>
                          <TableCell>{lead.district}</TableCell>
                          <TableCell>{lead.state}</TableCell>
                          <TableCell>{lead.reference}</TableCell>
                          <TableCell>{lead.executive}</TableCell>
                          <TableCell>{lead.manager}</TableCell>
                          <TableCell>{lastFollowUp ? format(new Date(lastFollowUp.date), 'PPP') : 'N/A'}</TableCell>
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
