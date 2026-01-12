'use client';

import { Button } from '@/components/ui/button';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo, useCallback } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

type LeadFilterProps = {
  allLeads: LeadFormData[];
  setFilteredLeads: (leads: LeadFormData[]) => void;
};

export default function LeadFilter({ allLeads, setFilteredLeads }: LeadFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilterState);

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const productNames = useMemo(() => ['all', ...Array.from(new Set(allLeads.map(l => l.selectedModule).filter(Boolean)))], [allLeads]);
  const executiveNames = useMemo(() => ['all', ...Array.from(new Set(allLeads.map(l => l.executive).filter(Boolean)))], [allLeads]);
  const givenByOptions = useMemo(() => ['all', ...Array.from(new Set(allLeads.map(l => l.givenBy).filter(Boolean)))], [allLeads]);
  const leadStatuses = useMemo(() => ['all', ...Array.from(new Set(allLeads.map(l => l.status).filter(Boolean)))], [allLeads]);
  const subLeadStatuses = useMemo(() => ['all', ...Array.from(new Set(allLeads.map(l => l.leadSubStatus).filter(Boolean)))], [allLeads]);
  const leadSources = useMemo(() => ['all', ...Array.from(new Set(allLeads.map(l => l.reference).filter(Boolean)))], [allLeads]);
  const enteredByOptions = useMemo(() => ['all', ...Array.from(new Set(allLeads.flatMap(l => l.followUps || []).map(f => f.enteredBy).filter(Boolean)))], [allLeads]);

  const handleShow = useCallback(() => {
    let leads = [...allLeads];
    // Apply filters here based on `filters` state
    setFilteredLeads(leads);
  }, [allLeads, filters, setFilteredLeads]);
  
  const handleReset = () => {
    setFilters(initialFilterState);
    setFilteredLeads(allLeads);
  };

  return (
    <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-semibold text-primary w-full p-2 border-b">
          Filter {isFilterOpen ? '[hide]' : '[show]'}
          {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Leave empty for all"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <Label>From:</Label>
                <RadioGroup
                  value={filters.fromSource}
                  onValueChange={(val) => handleFilterChange('fromSource', val)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="web" id="web" />
                    <Label htmlFor="web">Web Downloads</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual">Manual Uploads</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Label>Search for:</Label>
                <RadioGroup
                  value={filters.searchFor}
                  onValueChange={(val) => handleFilterChange('searchFor', val)}
                  className="flex gap-4 flex-wrap"
                >
                  {['Lead ID', 'Company', 'Contact Person', 'Phone', 'District', 'State', 'Email', 'Manager Name'].map(item => (
                    <div key={item} className="flex items-center space-x-2">
                      <RadioGroupItem value={item.toLowerCase().replace(' ', '')} id={item.toLowerCase().replace(' ', '')} />
                      <Label htmlFor={item.toLowerCase().replace(' ', '')}>{item}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
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
                    {filters.fromDate ? format(filters.fromDate, 'PPP') : <span>mm/dd/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filters.fromDate} onSelect={(d) => handleFilterChange('fromDate', d)} />
                </PopoverContent>
              </Popover>
            </div>
             <div className="space-y-2">
              <Label>To Date</Label>
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
                    {filters.toDate ? format(filters.toDate, 'PPP') : <span>mm/dd/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filters.toDate} onSelect={(d) => handleFilterChange('toDate', d)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Product Name</Label>
              <Select value={filters.productName} onValueChange={(v) => handleFilterChange('productName', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{productNames.map(p => <SelectItem key={p} value={p}>{p === 'all' ? '--All--' : p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Executive Name</Label>
              <Select value={filters.executiveName} onValueChange={(v) => handleFilterChange('executiveName', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{executiveNames.map(e => <SelectItem key={e} value={e}>{e === 'all' ? '--All--' : e}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Given by</Label>
              <Select value={filters.givenBy} onValueChange={(v) => handleFilterChange('givenBy', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{givenByOptions.map(g => <SelectItem key={g} value={g}>{g === 'all' ? '--All--' : g}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status of Lead</Label>
              <Select value={filters.statusOfLead} onValueChange={(v) => handleFilterChange('statusOfLead', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{leadStatuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? '--All--' : s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sub Status of Lead</Label>
              <Select value={filters.subStatusOfLead} onValueChange={(v) => handleFilterChange('subStatusOfLead', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{subLeadStatuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? '--All--' : s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select value={filters.leadSource} onValueChange={(v) => handleFilterChange('leadSource', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{leadSources.map(s => <SelectItem key={s} value={s}>{s === 'all' ? '--All--' : s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center space-x-2">
              <Checkbox
                id="doNotConsider"
                checked={filters.doNotConsider}
                onCheckedChange={(c) => handleFilterChange('doNotConsider', c)}
              />
              <Label htmlFor="doNotConsider">Do not consider Order Closed/Fake/Existing Users/Not Interested</Label>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-4 border-t pt-4 mt-4">
                <div className="flex items-center space-x-2">
                     <Checkbox
                        id="considerFollowUps"
                        checked={filters.considerFollowUps}
                        onCheckedChange={(c) => handleFilterChange('considerFollowUps', c)}
                    />
                    <Label htmlFor="considerFollowUps">consider Follow Ups</Label>
                </div>
            </div>

            {filters.considerFollowUps && (
              <>
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <RadioGroup
                        value={filters.followUpStatus}
                        onValueChange={(val) => handleFilterChange('followUpStatus', val)}
                        className="flex gap-4"
                        >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pending" id="pending" />
                            <Label htmlFor="pending">Follow Up Pending</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="made" id="made" />
                            <Label htmlFor="made">Follow Up Made</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !filters.followUpFromDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.followUpFromDate ? format(filters.followUpFromDate, 'PPP') : <span>mm/dd/yyyy</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.followUpFromDate} onSelect={(d) => handleFilterChange('followUpFromDate', d)} /></PopoverContent>
                  </Popover>
                </div>
                 <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !filters.followUpToDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.followUpToDate ? format(filters.followUpToDate, 'PPP') : <span>mm/dd/yyyy</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.followUpToDate} onSelect={(d) => handleFilterChange('followUpToDate', d)} /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Enter by</Label>
                    <Select value={filters.enterBy} onValueChange={(v) => handleFilterChange('enterBy', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{enteredByOptions.map(e => <SelectItem key={e} value={e}>{e === 'all' ? '--All--' : e}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Input value={filters.remarksFilter} onChange={(e) => handleFilterChange('remarksFilter', e.target.value)} />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleShow}>SHOW</Button>
            <Button variant="outline">TO EXCEL</Button>
            <Button variant="destructive" onClick={handleReset}>RESET</Button>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
}
