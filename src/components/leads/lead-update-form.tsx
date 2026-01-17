
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
import { CalendarIcon, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { LeadFormData } from './lead-upload-form';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { useUsers } from '@/context/users-context';
import { useAuth } from '@/context/auth-context';

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
    'Unattended',
    'Pursuing to Purchase',
    'Not interested',
    'Order closed',
    'Proposal Sent',
    'Do Not Contact',
    'Quote Sent',
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
  const [isReadyToUpdate, setIsReadyToUpdate] = useState(false);
  
  const { toast } = useToast();
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
        const leadData = {...foundLead};
        setLeadDetails(leadData);
        setFollowUps((foundLead as any).followUps || []);
        setCurrentStatus((foundLead as any).status || 'Initial');
        setRemarks('');
        setNextFollowUpDate(undefined);
        setIsReadyToUpdate(false);
        
    } else {
        handleResetLeadDetails();
    }
  }

  const handleLeadDetailChange = (field: keyof LeadFormData, value: string | boolean | number | Date | undefined) => {
    setLeadDetails(prev => ({...prev, [field]: value}));
  }

  const handleAddFollowUp = () => {
    const isOrderClosedRemark = remarks.trim().toLowerCase() === 'order closed';
    
    if (!remarks) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in the Remarks field.',
      });
      return;
    }
    
    if (!isOrderClosedRemark && !nextFollowUpDate) {
       toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a Next Follow-up Date.',
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
      nextFollowUp: isOrderClosedRemark || !nextFollowUpDate ? 'N/A' : format(nextFollowUpDate, 'PPP'),
      enteredBy: user?.username || 'Demo User',
    };
    
    const updatedFollowups = [...followUps, newFollowUp];
    setFollowUps(updatedFollowups);
    
    const updatedLeadDetails = {
      ...leadDetails,
      followUps: updatedFollowups,
      nextFollowUpDate: isOrderClosedRemark ? undefined : nextFollowUpDate?.toISOString(),
      status: isOrderClosedRemark ? 'Order closed' : leadDetails.status,
    };

    setLeadDetails(updatedLeadDetails);
    
    const updatedLeads = allLeads.map(l => l.leadId === leadDetails.leadId ? updatedLeadDetails : l);
    saveLeadsToLocalStorage(updatedLeads as LeadFormData[]);
    setAllLeads(updatedLeads as LeadFormData[]);


    setRemarks('');
    if(isOrderClosedRemark) {
      setCurrentStatus('Order closed');
    }
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
     if (!leadDetails.leadId) {
      toast({ variant: 'destructive', title: 'No Lead Selected', description: 'Please select a lead before updating its status.' });
      return;
    }
    
    const updatedLeadDetailsWithStatus = {
        ...leadDetails, 
        status: selectedStatus, 
        // Only set executiveViewDate if it's not already set
        executiveViewDate: leadDetails.executiveViewDate || new Date().getTime(),
    };
    
    const updatedLeads = allLeads.map(l => l.leadId === leadDetails.leadId ? updatedLeadDetailsWithStatus : l);
    saveLeadsToLocalStorage(updatedLeads as LeadFormData[]);
    setAllLeads(updatedLeads as LeadFormData[]);
    
    toast({ title: 'Status Updated', description: `Lead ${leadDetails.leadId} status updated to ${selectedStatus}.` });

    setLeadDetails(updatedLeadDetailsWithStatus);
    setCurrentStatus(selectedStatus);
    setSelectedStatus('');
  };
  
  const handleResetLeadDetails = () => {
    setLeadDetails({});
    setFollowUps([]);
    setCurrentStatus('Initial');
    setNextFollowUpDate(undefined);
    setTransferredTo('');
    setSelectedStatus('');
    setRemarks('');
    setIsReadyToUpdate(false);
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
    setIsReadyToUpdate(false);
  };
  
  const isOrderClosedRemark = remarks.trim().toLowerCase() === 'order closed';


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
                  <Input id="company" value={leadDetails.company || ''} readOnly className="bg-muted" />
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
                <Input id="address" value={leadDetails.address || ''} readOnly className="bg-muted" />
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
                          disabled
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
                <Input id="reference" value={leadDetails.reference || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="givenBy">Given By</Label>
                <Input id="givenBy" value={leadDetails.givenBy || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="executive">Executive</Label>
                <Input id="executive" value={leadDetails.executive || ''} readOnly className="bg-muted" />
                 {leadDetails.leadId && (
                   <Popover>
                    <PopoverTrigger asChild>
                      <CircleDot className="absolute right-3 top-9 h-5 w-5 text-black cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Lead Details</h4>
                          <p className="text-sm text-muted-foreground">
                            Quick contact information for this lead.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Company</Label>
                            <span className="col-span-2 h-8">{leadDetails.company}</span>
                          </div>
                           <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Contact</Label>
                            <span className="col-span-2 h-8">{leadDetails.contactPerson}</span>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Phone</Label>
                             <span className="col-span-2 h-8">{leadDetails.contactNumber}</span>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Email</Label>
                             <span className="col-span-2 h-8 truncate">{leadDetails.email}</span>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <Select 
                  value={leadDetails.selectedModule || ''} 
                  onValueChange={(value) => handleLeadDetailChange('selectedModule', value)}
                  disabled
                >
                  <SelectTrigger id="module">
                    <SelectValue placeholder="Select Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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
                <Input id="manager" value={leadDetails.manager || ''} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                  <div className="flex items-center space-x-2 mt-2">
                      <Checkbox 
                        id="readyToUpdate"
                        checked={isReadyToUpdate}
                        onCheckedChange={(checked) => setIsReadyToUpdate(checked as boolean)}
                       />
                      <Label htmlFor="readyToUpdate">Yes, I am Ready to Update.</Label>
                  </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                  <Button onClick={handleSaveLeadDetails} disabled={!isReadyToUpdate}>Save</Button>
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
              <Label className="font-semibold shrink-0">TRANSFERRED LEAD</Label>
              <div className="flex flex-col gap-2">
                <Select value={transferredTo} onValueChange={setTransferredTo}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Executive ID..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Yathish N">Yathish N</SelectItem>
                        <SelectItem value="Mandanna N">Mandanna N</SelectItem>
                        <SelectItem value="Hukum Chand Kewat">Hukum Chand Kewat</SelectItem>
                        <SelectItem value="Hemant Sharma">Hemant Sharma</SelectItem>
                    </SelectContent>
                </Select>
              </div>
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
                    disabled={isOrderClosedRemark}
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
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No follow-ups added yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className='bg-primary/10'>
          <CardTitle className='text-primary text-base font-bold'>Lead Status</CardTitle>
        </CardHeader>
        <CardContent className='p-4 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                <div className="space-y-2">
                    <Label htmlFor="initialRemarks">Initial Remarks</Label>
                    <Textarea 
                      id="initialRemarks"
                      value={leadDetails.initialRemarks || ''}
                      onChange={(e) => handleLeadDetailChange('initialRemarks', e.target.value)}
                      placeholder="Enter initial remarks for the lead..."
                      rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Current Status</Label>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold shrink-0 text-muted-foreground">({currentStatus})</span>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={!leadDetails.leadId}>
                          <SelectTrigger className="w-full min-w-[200px]">
                              <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>
                          <SelectContent>
                              {leadStatusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleUpdateStatus} disabled={!leadDetails.leadId}>Update</Button>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    