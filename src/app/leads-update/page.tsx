
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/app-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayModule, allModules, allHrModules, allFinanceModules, allGeneralModules, financeModules, generalModules } from '@/lib/modules';

const LEADS_PER_PAGE = 10;
type TabValue = 'all' | 'not-viewed' | 'follow-ups-due' | 'zero-follow-ups' | 'search-result';

const leadStatusOptions = [
    'Attended',
    'Not viewed',
    'Unattended',
    'Pursuing to Purchase',
    'Not interested',
    'Order closed',
    'Proposal Sent',
    'Do Not Contact',
    'Quote Sent',
    'Demo Given',
];

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

export default function LeadsUpdatePage() {
  const { user, isAuthenticated, isLoading, leads: allLeads, users } = useApp();
  const router = useRouter();
  const pageTopRef = useRef<HTMLDivElement>(null);

  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('leadId');
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedModules, setSelectedModules] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [otherExecutiveInput, setOtherExecutiveInput] = useState('');
  
  const [givenBy, setGivenBy] = useState('all');
  const [otherGivenByInput, setOtherGivenByInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [otherStatusInput, setOtherStatusInput] = useState('');
  const [selectedSubStatus, setSelectedSubStatus] = useState('all');
  const [otherSubStatusInput, setOtherSubStatusInput] = useState('');
  const [selectedLeadSource, setSelectedLeadSource] = useState('all');
  const [otherLeadSourceInput, setOtherLeadSourceInput] = useState('');
  const [considerStatus, setConsiderStatus] = useState(false);

  const [followUpStatus, setFollowUpStatus] = useState('pending');
  const [followUpFromDate, setFollowUpFromDate] = useState('');
  const [followUpToDate, setFollowUpToDate] = useState('');
  const [followUpEnteredBy, setFollowUpEnteredBy] = useState('all');
  const [otherFollowUpEnteredByInput, setOtherFollowUpEnteredByInput] = useState('');

  const allUsernames = useMemo(() => users.map(u => u.username), [users]);
  const executiveDropdownUsers = useMemo(() => {
    const excludedNames = ['Varghese Vincent', 'Sam Devasia', 'Athmiya A G'];
    return users
      .filter(u => !excludedNames.includes(u.username))
      .map(u => u.username);
  }, [users]);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const visibleLeads = useMemo(() => {
    if (!user) return [];

    if (user.role === 'Executive') {
      return allLeads.filter(lead => lead.executive === user.username);
    }

    return allLeads;
  }, [allLeads, user]);

  const applyTabFilter = (tab: TabValue) => {
     let tempLeads = [...visibleLeads];

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
      case 'all':
      default:
        tempLeads.sort((a,b) => a.creationDate - b.creationDate);
        break;
    }
    setFilteredLeads(tempLeads);
    setCurrentPage(1);
  }

  useEffect(() => {
    if (activeTab !== 'search-result') {
      applyTabFilter(activeTab);
    }
  }, [visibleLeads, activeTab]);

  const handleShowButtonClick = () => {
    setActiveTab('search-result');
    let tempLeads = [...visibleLeads];

    if (considerStatus) {
        const excludedStatuses = ['Order closed', 'Fake', 'Existing Users', 'Not interested'];
        tempLeads = tempLeads.filter(lead => !excludedStatuses.includes(lead.status || ''));
    }

    if (searchTerm.trim() !== '') {
      tempLeads = tempLeads.filter(lead => {
        const leadValue = (lead[searchCategory as keyof LeadFormData] as string)?.toString().toLowerCase() || '';
        return leadValue.startsWith(searchTerm.toLowerCase());
      });
    }
    
    if (fromDate) {
      const fromTimestamp = new Date(`${fromDate}T00:00:00`).getTime();
      tempLeads = tempLeads.filter(lead => lead.creationDate >= fromTimestamp);
    }
    if (toDate) {
      const toTimestamp = new Date(`${toDate}T23:59:59`).getTime();
      tempLeads = tempLeads.filter(lead => lead.creationDate <= toTimestamp);
    }
    
    if (selectedModules) {
        const modulesToFilter = selectedModules.split(', ').filter(Boolean);
        if (modulesToFilter.length > 0) {
            tempLeads = tempLeads.filter(lead => {
                if (!lead.selectedModule) return false;
                const leadModules = lead.selectedModule.split(', ').filter(Boolean);
                return modulesToFilter.some(m => leadModules.includes(m));
            });
        }
    }
    if (selectedExecutive !== 'all' && selectedExecutive !== 'Other') {
      tempLeads = tempLeads.filter(lead => (lead.executive || '').toLowerCase() === selectedExecutive.toLowerCase());
    }
    if (givenBy !== 'all' && givenBy !== 'Other') {
      tempLeads = tempLeads.filter(lead => (lead.givenBy || '').toLowerCase() === givenBy.toLowerCase());
    }
    if (selectedStatus !== 'all') {
      tempLeads = tempLeads.filter(lead => lead.status === selectedStatus);
    }
    if (selectedSubStatus !== 'all' && selectedSubStatus !== 'Other') {
      tempLeads = tempLeads.filter(lead => lead.leadSubStatus === selectedSubStatus);
    }
    if (selectedLeadSource !== 'all' && selectedLeadSource !== 'Other') {
      tempLeads = tempLeads.filter(lead => lead.reference === selectedLeadSource);
    }

    if (considerStatus) {
      if (followUpStatus === 'pending') {
        tempLeads = tempLeads.filter(lead => {
          if (!lead.nextFollowUpDate) return false;

          try {
            const nextFollowUp = new Date(lead.nextFollowUpDate);
            if (followUpFromDate && nextFollowUp < startOfDay(new Date(`${followUpFromDate}T00:00:00`))) {
              return false;
            }
            if (followUpToDate && nextFollowUp > endOfDay(new Date(`${followUpToDate}T00:00:00`))) {
              return false;
            }
          } catch {
            return false;
          }

          if (followUpEnteredBy !== 'all') {
             if (!lead.followUps || !lead.followUps.some(fu => (fu.enteredBy || '').toLowerCase() === followUpEnteredBy.toLowerCase())) {
              return false;
            }
          }
          
          return true;
        });
      } else if (followUpStatus === 'made') {
        tempLeads = tempLeads.filter(lead => {
          if (!lead.followUps || lead.followUps.length === 0) return false;
          
          return lead.followUps.some(followUp => {
            const personMatch = followUpEnteredBy === 'all' || (followUp.enteredBy || '').toLowerCase() === followUpEnteredBy.toLowerCase();
            if (!personMatch) return false;
            
            try {
              const followUpDateObj = new Date(followUp.date);
               if (followUpFromDate && followUpDateObj < startOfDay(new Date(`${followUpFromDate}T00:00:00`))) {
                return false;
              }
              if (followUpToDate && followUpDateObj > endOfDay(new Date(`${followUpToDate}T00:00:00`))) {
                return false;
              }
              return true;
            } catch {
               return false;
            }
          });
        });
      }
    }

    setFilteredLeads(tempLeads);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchCategory('leadId');
    setActiveTab('all');
    
    setFromDate('');
    setToDate('');
    setSelectedModules('');
    setSelectedExecutive('all');
    setOtherExecutiveInput('');
    setGivenBy('all');
    setOtherGivenByInput('');
    setSelectedStatus('all');
    setOtherStatusInput('');
    setSelectedSubStatus('all');
    setOtherSubStatusInput('');
    setSelectedLeadSource('all');
    setOtherLeadSourceInput('');
    setConsiderStatus(false);
    
    setFollowUpStatus('pending');
    setFollowUpFromDate('');
    setFollowUpToDate('');
    setFollowUpEnteredBy('all');
    setOtherFollowUpEnteredByInput('');

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

  const handleStatusFilterChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleSetOtherStatus = () => {
    if(otherStatusInput.trim()){
      const newStatus = otherStatusInput.trim();
      setSelectedStatus(newStatus);
      setOtherStatusInput('');
    }
  };

  const handleSetOtherSubStatus = () => {
    if(otherSubStatusInput.trim()){
      const newStatus = otherSubStatusInput.trim();
      setSelectedSubStatus(newStatus);
      setOtherSubStatusInput('');
    }
  };

  const handleSetOtherFollowUpEnteredBy = () => {
    if(otherFollowUpEnteredByInput.trim()){
      const newGivenBy = otherFollowUpEnteredByInput.trim();
      setFollowUpEnteredBy(newGivenBy);
      setOtherFollowUpEnteredByInput('');
    }
  };

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(start, start + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  const selectedModulesArray = selectedModules ? selectedModules.split(', ').filter(Boolean) : [];

  const handleModuleToggle = (moduleName: string) => {
    const newSelection = new Set(selectedModulesArray);
    newSelection.has(moduleName) ? newSelection.delete(moduleName) : newSelection.add(moduleName);
    setSelectedModules(Array.from(newSelection).join(', '));
  };

  const handleCategoryToggle = (categoryModules: string[], isAdding: boolean) => {
    const newSelection = new Set(selectedModulesArray);
    categoryModules.forEach(m => isAdding ? newSelection.add(m) : newSelection.delete(m));
    setSelectedModules(Array.from(newSelection).join(', '));
  };

  const getCategoryCheckedState = (categoryModules: string[]): boolean | 'indeterminate' => {
    const selectionCount = categoryModules.filter(m => selectedModulesArray.includes(m)).length;
    if (selectionCount === 0) return false;
    if (selectionCount === categoryModules.length) return true;
    return 'indeterminate';
  };
  
  const handleAllToggle = (isAdding: boolean) => {
    setSelectedModules(isAdding ? allModules.join(', ') : '');
  };

  const getAllCheckedState = (): boolean | 'indeterminate' => {
    const selectionCount = allModules.filter(m => selectedModulesArray.includes(m)).length;
    if (selectionCount === 0) return false;
    if (selectionCount === allModules.length) return true;
    return 'indeterminate';
  };

  const getModuleButtonText = () => {
    if (!selectedModules) {
        return 'Select Module(s)...';
    }

    const selected = new Set(selectedModules.split(', ').filter(Boolean));
    if (selected.size === 0) {
        return 'Select Module(s)...';
    }
    if (selected.size === allModules.length) {
        return 'All Modules Selected';
    }
    
    const buttonText = getDisplayModule(selectedModules);

    if(buttonText.endsWith(" Module") && !buttonText.includes(',')) {
        return `${buttonText} Selected`;
    }
    
    return buttonText;
  };

  const ModuleSelectItem = ({ moduleName }: { moduleName: string }) => (
    <div key={moduleName} className="flex items-center space-x-3 rounded-md p-2 pr-4 hover:bg-accent cursor-pointer" onClick={() => handleModuleToggle(moduleName)}>
        <Checkbox id={`mod-filter-${moduleName}`} checked={selectedModulesArray.includes(moduleName)} readOnly tabIndex={-1} className="ml-1" />
        <label htmlFor={`mod-filter-${moduleName}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">{moduleName}</label>
    </div>
  );

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <div className="flex flex-col gap-6" ref={pageTopRef}>

        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              UPDATE LEADS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            <LeadUpdateForm
              leadId={selectedLeadId}
            />

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

            {showFilters && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="search" className="font-medium shrink-0">Search</Label>
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
                            <RadioGroupItem value="web" id="web"/> <Label htmlFor='web'>Web Downloads</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="manual" id="manual"/> <Label htmlFor='manual'>Manual Uploads</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="both" id="both"/> <Label htmlFor='both'>Both</Label>
                          </div>
                        </RadioGroup>
                    </div>
                  </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label>From Date</Label>
                      <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}/>
                    </div>
                    <div className="space-y-1">
                      <Label>To Date</Label>
                      <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)}/>
                    </div>
                    <div className="space-y-1">
                      <Label>ModuleName</Label>
                      <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                            <span className="truncate">{getModuleButtonText()}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                           <div className="p-2 font-bold text-center border-b">Modules</div>
                          <ScrollArea className="h-72">
                            <div className="space-y-1 p-1">
                              <div
                                className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold cursor-pointer hover:bg-accent"
                                onClick={() => {
                                  setSelectedModules('');
                                  setProductPopoverOpen(false);
                                }}
                              >
                                <div className="w-4 h-4 ml-1" /> {/* Spacer */}
                                <label className="w-full cursor-pointer">Select module</label>
                              </div>
                              <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold">
                                <Checkbox id="all-modules-category-filter" checked={getAllCheckedState()} onCheckedChange={(checked) => handleAllToggle(!!checked)} className="ml-1" />
                                <label htmlFor="all-modules-category-filter" className="w-full cursor-pointer">All Modules</label>
                              </div>
                              <Collapsible>
                                <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold">
                                    <Checkbox id="hr-category-filter" checked={getCategoryCheckedState(allHrModules)} onCheckedChange={(checked) => handleCategoryToggle(allHrModules, !!checked)} className="ml-1" />
                                    <CollapsibleTrigger asChild>
                                      <label htmlFor="hr-category-filter" className="flex w-full items-center justify-between cursor-pointer">
                                        <span>HR Modules</span>
                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                      </label>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="space-y-1 pt-1 pl-6">
                                  {allHrModules.map((product) => (<ModuleSelectItem key={product} moduleName={product} />))}
                                </CollapsibleContent>
                              </Collapsible>
                              <Collapsible>
                                <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold">
                                    <Checkbox id="finance-category-filter" checked={getCategoryCheckedState(allFinanceModules)} onCheckedChange={(checked) => handleCategoryToggle(allFinanceModules, !!checked)} className="ml-1" />
                                    <CollapsibleTrigger asChild>
                                        <label htmlFor="finance-category-filter" className="flex w-full items-center justify-between cursor-pointer">
                                            <span>Finance Modules</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                        </label>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="space-y-1 pt-1 pl-6">
                                  {financeModules.map((product) => (<ModuleSelectItem key={product} moduleName={product} />))}
                                </CollapsibleContent>
                              </Collapsible>
                              <Collapsible>
                                <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold">
                                    <Checkbox id="general-category-filter" checked={getCategoryCheckedState(allGeneralModules)} onCheckedChange={(checked) => handleCategoryToggle(allGeneralModules, !!checked)} className="ml-1" />
                                    <CollapsibleTrigger asChild>
                                        <label htmlFor="general-category-filter" className="flex w-full items-center justify-between cursor-pointer">
                                            <span>General Modules</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                        </label>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="space-y-1 pt-1 pl-6">
                                  {generalModules.map((product) => (<ModuleSelectItem key={product} moduleName={product} />))}
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label>Executive Name</Label>
                      <Select value={selectedExecutive} onValueChange={(value) => setSelectedExecutive(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                           {executiveDropdownUsers.map(exec => (
                            <SelectItem key={exec} value={exec}>
                              {exec}
                            </SelectItem>
                          ))}
                          {!executiveDropdownUsers.includes(selectedExecutive) && selectedExecutive !== 'all' && selectedExecutive !== 'Other' && (
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-1">
                      <Label htmlFor="givenBy">Given by</Label>
                       <Select value={givenBy} onValueChange={(value) => setGivenBy(value)}>
                        <SelectTrigger id="givenBy">
                          <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {allUsernames.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                          {!allUsernames.includes(givenBy) && givenBy !== 'all' && givenBy !== 'Other' && (
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
                        <Label>Status of Lead</Label>
                        <Select value={selectedStatus} onValueChange={handleStatusFilterChange}>
                            <SelectTrigger><SelectValue placeholder="--All--" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {leadStatusOptions.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                                {!leadStatusOptions.includes(selectedStatus) && selectedStatus !== 'all' && selectedStatus !== 'Other' && (
                                    <SelectItem value={selectedStatus}>{selectedStatus}</SelectItem>
                                )}
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {selectedStatus === 'Other' && (
                        <div className="mt-2">
                           <div className="flex items-center gap-2">
                              <Input
                                placeholder="Specify other status"
                                value={otherStatusInput}
                                onChange={(e) => setOtherStatusInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSetOtherStatus();
                                }}
                              />
                              <Button size="sm" onClick={handleSetOtherStatus}>OK</Button>
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
                           {selectedLeadSource && !references.includes(selectedLeadSource) ? (
                            <span className="truncate">{selectedLeadSource}</span>
                           ) : (
                            <SelectValue placeholder="--All--" />
                           )}
                        </SelectTrigger>
                        <SelectContent>
                          {references.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
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

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="considerStatus"
                        checked={considerStatus}
                        onCheckedChange={(checked) => setConsiderStatus(checked as boolean)}
                      />
                      <Label htmlFor="considerStatus">Do not consider Order Closed/Fake/Existing Users/Not Interested</Label>
                    </div>

                    {considerStatus && (
                      <div className="space-y-4 pl-6 border-l-2 border-muted ml-2 pt-2">
                        
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
                              <Label htmlFor="enteredByFollowUp">Enter by</Label>
                              <Select value={followUpEnteredBy} onValueChange={(value) => setFollowUpEnteredBy(value)}>
                                  <SelectTrigger id="enteredByFollowUp">
                                      <SelectValue placeholder="--All--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">All</SelectItem>
                                      {allUsernames.map((name) => (
                                      <SelectItem key={name} value={name}>
                                          {name}
                                      </SelectItem>
                                      ))}
                                      {!allUsernames.includes(followUpEnteredBy) && followUpEnteredBy !== 'all' && followUpEnteredBy !== 'Other' && (
                                          <SelectItem value={followUpEnteredBy}>{followUpEnteredBy}</SelectItem>
                                      )}
                                      <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                              </Select>
                              {followUpEnteredBy === 'Other' && (
                                  <div className="mt-2">
                                      <div className="flex items-center gap-2">
                                          <Input
                                              placeholder="Specify who entered it"
                                              value={otherFollowUpEnteredByInput}
                                              onChange={(e) => setOtherFollowUpEnteredByInput(e.target.value)}
                                              onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSetOtherFollowUpEnteredBy();
                                              }}
                                          />
                                          <Button size="sm" onClick={handleSetOtherFollowUpEnteredBy}>OK</Button>
                                      </div>
                                  </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button onClick={handleShowButtonClick}>SHOW</Button>
                    <Button variant="secondary">TO EXCEL</Button>
                    <Button variant="destructive" onClick={handleResetFilters}>RESET</Button>
                  </div>

                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
                  <TabsList>
                    <TabsTrigger value="all">All Leads</TabsTrigger>
                    <TabsTrigger value="not-viewed">Leads not Viewed</TabsTrigger>
                    <TabsTrigger value="follow-ups-due">Follow Ups Due</TabsTrigger>
                    <TabsTrigger value="zero-follow-ups">Zero Follow Ups!</TabsTrigger>
                    <TabsTrigger value="search-result">Search Result</TabsTrigger>
                  </TabsList>
                </Tabs>
                <CardHeader className="p-0 pt-4">
                  <CardTitle className="text-base">
                    List of Leads &gt;&gt; [{activeTab.replace('-', ' ').toUpperCase()} ({filteredLeads.length} Records)]
                  </CardTitle>
                </CardHeader>
                 <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-[2700px]">
                    <TableHeader className="bg-muted">
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
                        <TableHead>Executive</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Given By</TableHead>
                        <TableHead>Last Followed Date</TableHead>
                        <TableHead>Enter by</TableHead>
                        <TableHead>Next followup Date</TableHead>
                        <TableHead>Last Followup Remarks</TableHead>
                        <TableHead>Lead Status</TableHead>
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
                          <TableCell>{getDisplayModule(lead.selectedModule)}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.contactPerson}</TableCell>
                          <TableCell>{lead.contactNumber}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.address}</TableCell>
                          <TableCell>{lead.district}</TableCell>
                          <TableCell>{lead.state}</TableCell>
                          <TableCell>{lead.reference}</TableCell>
                          <TableCell>{lead.executive}</TableCell>
                          <TableCell>{lead.manager}</TableCell>
                          <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                          <TableCell>{lastFollowUp ? format(new Date(lastFollowUp.date), 'PPP') : 'N/A'}</TableCell>
                          <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                          <TableCell>{nextFollowupDate}</TableCell>
                          <TableCell>{lastFollowUp ? lastFollowUp.remarks : 'N/A'}</TableCell>
                          <TableCell>{lead.status}</TableCell>
                          <TableCell>{lead.initialRemarks}</TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
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
