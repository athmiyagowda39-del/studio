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
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Check, ChevronsUpDown, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { LeadFormData } from './lead-upload-form';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';

type FollowUp = {
  id: number;
  date: string;
  remarks: string;
  nextFollowUp: string;
  enteredBy: string;
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

const executiveIds = [
    'EXEC-001',
    'EXEC-002',
    'EXEC-003',
    'EXEC-004',
    'EXEC-005',
    'EXEC-006'
];

const saveLeadsToLocalStorage = (leads: LeadFormData[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('allLeads', JSON.stringify(leads));
    // Dispatch a storage event to notify other tabs/windows
    window.dispatchEvent(new Event('storage'));
  }
};


export default function LeadUpdateForm({ leadId, allLeads, setAllLeads }: { leadId: string | null, allLeads: LeadFormData[], setAllLeads: (leads: LeadFormData[]) => void }) {
  const [leadDetails, setLeadDetails] = useState<Partial<LeadFormData>>({});
  
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date>();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [currentStatus, setCurrentStatus] = useState('Initial');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [transferredTo, setTransferredTo] = useState('');
  const [transferredToOpen, setTransferredToOpen] = useState(false);

  const [leadIdForStatus, setLeadIdForStatus] = useState('');
  const [initialRemarks, setInitialRemarks] = useState('');
  
  const { toast } = useToast();

   useEffect(() => {
    if (leadId) {
        findLeadAndSetDetails(leadId);
    } else {
        handleResetLeadDetails();
    }
  }, [leadId, allLeads]);


  const findLeadAndSetDetails = (id: string) => {
     if (!id || !allLeads) {
        setLeadDetails({});
        return;
    }
    const foundLead = allLeads.find(lead => lead.leadId === id);
    if (foundLead) {
        let leadWithViewDate: Partial<LeadFormData> = { ...foundLead };
        if (!foundLead.executiveViewDate) {
          leadWithViewDate.executiveViewDate = new Date().getTime();
          
          const updatedLeads = allLeads.map(l => l.leadId === id ? { ...l, executiveViewDate: leadWithViewDate.executiveViewDate } : l);
          saveLeadsToLocalStorage(updatedLeads);
          setAllLeads(updatedLeads);

          console.log("Setting executiveViewDate for lead:", id);
        }

        setLeadDetails(leadWithViewDate);
        setFollowUps((foundLead as any).followUps || []);
        setCurrentStatus((foundLead as any).status || 'Initial');
        setLeadIdForStatus(id);
        if(foundLead.nextFollowUpDate) {
          setNextFollowUpDate(new Date(foundLead.nextFollowUpDate));
        } else {
          setNextFollowUpDate(undefined);
        }
    } else {
        handleResetLeadDetails();
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
      enteredBy: 'Demo User',
    };
    
    const updatedFollowups = [...followUps, newFollowUp];
    setFollowUps(updatedFollowups);
    
    const updatedLeadDetails = {
      ...leadDetails,
      followUps: updatedFollowups,
      nextFollowUpDate: nextFollowUpDate.toISOString(),
    };
    setLeadDetails(updatedLeadDetails);

    const updatedLeads = allLeads.map(l => l.leadId === leadDetails.leadId ? updatedLeadDetails : l);
    saveLeadsToLocalStorage(updatedLeads as LeadFormData[]);
    setAllLeads(updatedLeads as LeadFormData[]);


    setRemarks('');
    setNextFollowUpDate(undefined);
    
    toast({
        title: "Follow-up added",
        description: "Your follow-up has been recorded.",
    });
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      toast({ variant: 'destructive', title: 'No Status Selected', description: 'Please select a status to update.' });
      return;
    }
     if (!leadIdForStatus) {
      toast({ variant: 'destructive', title: 'No Lead Selected', description: 'Please select a lead before updating its status.' });
      return;
    }
    
    const updatedLeadDetails = {
        ...leadDetails, 
        status: selectedStatus, 
        leadStatusRemarks: initialRemarks
    };
    
    const updatedLeads = allLeads.map(l => l.leadId === leadIdForStatus ? updatedLeadDetails : l);
    saveLeadsToLocalStorage(updatedLeads as LeadFormData[]);
    setAllLeads(updatedLeads as LeadFormData[]);
    
    toast({ title: 'Status Updated', description: `Lead ${leadIdForStatus} status updated to ${selectedStatus}.` });

    if (leadDetails.leadId === leadIdForStatus) {
        setLeadDetails(updatedLeadDetails);
        setCurrentStatus(selectedStatus);
    }
    setInitialRemarks('');
    setSelectedStatus('');
  };
  
  const handleResetLeadDetails = () => {
    setLeadDetails({});
    setFollowUps([]);
    setCurrentStatus('Initial');
    setNextFollowUpDate(undefined);
    setTransferredTo('');
    setLeadIdForStatus('');
    setInitialRemarks('');
    setSelectedStatus('');
  };

  const handleSaveLeadDetails = async () => {
    if (!leadDetails.leadId) {
      toast({ variant: 'destructive', title: 'No Lead Loaded', description: 'Please search and load a lead before saving.' });
      return;
    }

    const updatedLeads = allLeads.map(l => l.leadId === leadDetails.leadId ? leadDetails : l);
    saveLeadsToLocalStorage(updatedLeads as LeadFormData[]);
    setAllLeads(updatedLeads as LeadFormData[]);
    
    toast({ title: 'Lead Updated', description: `Lead ${leadDetails.leadId} has been successfully updated.` });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LEAD CONTACT CARD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-2">
                <Label htmlFor="searchLeadId">Lead(id)</Label>
                  <Input 
                      id="searchLeadId" 
                      placeholder="Select a lead from the table below"
                      value={leadDetails.leadId || ''}
                      readOnly
                      className="bg-muted"
                    />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={leadDetails.company || ''} onChange={(e) => handleLeadDetailChange('company', e.target.value)} />
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
                <Input id="district" value={leadDetails.district || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={leadDetails.state || ''} readOnly className="bg-muted"/>
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
                <Label htmlFor="dealerViewDate">Executive viewed date</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
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
              <div className="space-y-2 relative">
                <Label htmlFor="executive">Executive</Label>
                <Input id="executive" value={leadDetails.executive || ''} onChange={(e) => handleLeadDetailChange('executive', e.target.value)} />
                 {leadDetails.leadId && (
                  <CircleDot className="absolute right-3 top-9 h-5 w-5 text-black" />
                )}
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
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">LEAD TRACKER</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className='bg-primary/10'>
          <CardTitle className='text-primary text-base font-bold'>Lead Status</CardTitle>
        </CardHeader>
        <CardContent className='p-4 space-y-4'>
            <div className='flex flex-col gap-4'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="lead-id-status" className="shrink-0">Initial Remarks:</Label>
                         <Input 
                            id="lead-id-status" 
                            placeholder="Select Lead..."
                            value={leadIdForStatus ? `${leadDetails.company} (${leadIdForStatus})` : ''}
                            readOnly
                            className="bg-muted"
                          />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="font-semibold shrink-0">Current Status: {currentStatus}</span>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={!leadIdForStatus}>
                        <SelectTrigger className="w-full min-w-[200px]">
                            <SelectValue placeholder="-- Select --" />
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
                        placeholder="Enter remarks here..."
                        value={initialRemarks}
                        onChange={(e) => setInitialRemarks(e.target.value)}
                        className="min-h-[40px]"
                        disabled={!leadIdForStatus}
                    />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
