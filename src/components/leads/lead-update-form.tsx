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
import { useState } from 'react';
import { pincodeData } from '@/lib/pincodes';
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
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type FollowUp = {
  id: number;
  date: string;
  remarks: string;
  nextFollowUp: string;
  enteredBy: string;
};

export default function LeadUpdateForm() {
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date>();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [currentStatus, setCurrentStatus] = useState('Initial');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const { toast } = useToast();

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPincode = e.target.value;
    setPincode(newPincode);

    const location = pincodeData[newPincode];
    if (location) {
      setState(location.state);
      setDistrict(location.district);
    } else {
      setState('');
      setDistrict('');
    }
  };

  const handleAddFollowUp = () => {
    if (!remarks || !nextFollowUpDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill Remarks and Next Follow-up Date.',
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
    setFollowUps([...followUps, newFollowUp]);
    setRemarks('');
    setNextFollowUpDate(undefined);
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
    setCurrentStatus(selectedStatus);
    toast({
      title: 'Status Updated',
      description: `Lead status updated to ${selectedStatus}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">1050</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Attended</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">500</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Not viewed</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">32</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Demo Given</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">301</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Unattended</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">
              Pursuing to Purchase
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Not interested</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">201</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm font-medium">Order closed</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <p className="text-2xl font-bold">10</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">LEAD CONTACT CARD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyId">Company(id)</Label>
                  <Input id="companyId" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact person</Label>
                  <Input id="contactPerson" />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="pincode">Pin code</Label>
                  <Input id="pincode" value={pincode} onChange={handlePincodeChange} />
                </div>
                <div></div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" value={district} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email ID</Label>
                  <Input id="email" type="email" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input id="reference" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="givenBy">Given By</Label>
                  <Input id="givenBy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfLead">Date of lead</Label>
                  <Input id="dateOfLead" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executive">Executive</Label>
                  <Input id="executive" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executiveViewDate">Executive view Date</Label>
                  <Input id="executiveViewDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Input id="module" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Input id="manager" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Executive Member: Manager:</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="readyToUpdate" />
                    <Label htmlFor="readyToUpdate">
                      Yes I&apos;m ready to update
                    </Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset</Button>
                <Button>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">LEAD TRACKER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transferredLead">TRANSFERRED LEAD</Label>
                <Input id="transferredLead" />
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
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
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
            {followUps.map((followUp) => (
              <TableRow key={followUp.id}>
                <TableCell>{followUp.id}</TableCell>
                <TableCell>{followUp.date}</TableCell>
                <TableCell>{followUp.remarks}</TableCell>
                <TableCell>{followUp.nextFollowUp}</TableCell>
                <TableCell>{followUp.enteredBy}</TableCell>
              </TableRow>
            ))}
            {followUps.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No follow-ups added yet.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4">
        <Label>Lead status</Label>
        <div>
          <span className="font-semibold">Initial:</span> {currentStatus}
        </div>
        <div>
          <span className="font-semibold">Current:</span> {currentStatus}
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Attended">Attended</SelectItem>
            <SelectItem value="Not viewed">Not viewed</SelectItem>
            <SelectItem value="Demo Given">Demo Given</SelectItem>
            <SelectItem value="Unattended">Unattended</SelectItem>
            <SelectItem value="Pursuing to Purchase">
              Pursuing to Purchase
            </SelectItem>
            <SelectItem value="Not interested">Not interested</SelectItem>
            <SelectItem value="Order closed">Order closed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleUpdateStatus}>Update</Button>
      </div>

       <div className="space-y-4 pt-6 border-t">
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
                <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-2">
                    <Label htmlFor="search">Search</Label>
                    <Input id="search" placeholder="Leave empty for all" />
                    </div>
                    <div className="flex items-center gap-4">
                    <Label>From:</Label>
                    <RadioGroup defaultValue="both" className="flex gap-4">
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
                <div>
                    <RadioGroup className="flex flex-wrap gap-4">
                    <Label>Search for:</Label>
                    {[
                        'Lead ID',
                        'Company',
                        'Contact Person',
                        'Phone',
                        'Cell',
                        'Email',
                        'District',
                        'State',
                        'Manager Name',
                    ].map((item) => (
                        <div className="flex items-center space-x-2" key={item}>
                        <RadioGroupItem
                            value={item.toLowerCase().replace(' ', '')}
                            id={`search-for-${item.toLowerCase().replace(' ', '')}`}
                        />
                        <Label htmlFor={`search-for-${item.toLowerCase().replace(' ', '')}`}>
                            {item}
                        </Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                    <Label htmlFor="from-date">From Date</Label>
                    <Input id="from-date" type="date" />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="to-date">To Date</Label>
                    <Input id="to-date" type="date" />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Select>
                        <SelectTrigger>
                        <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="product1">Product 1</SelectItem>
                        <SelectItem value="product2">Product 2</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="executive-name">Executive Name</Label>
                    <Select>
                        <SelectTrigger>
                        <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="exec1">Executive 1</SelectItem>
                        <SelectItem value="exec2">Executive 2</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="given-by">Given by</Label>
                    <Select>
                        <SelectTrigger>
                        <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="given1">Given by 1</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="status-of-lead">Status of Lead</Label>
                    <Select>
                        <SelectTrigger>
                        <SelectValue placeholder="--All--" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="status1">Status 1</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                </CardContent>
            </Card>
            </CollapsibleContent>
        </Collapsible>
      </div>

    </div>
  );
}
