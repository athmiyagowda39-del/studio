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
import { Check, ChevronsUpDown, Download, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';

type ParsedData = (string | number)[][];

export type FollowUp = {
  id: number;
  date: string;
  remarks: string;
  nextFollowUp: string;
  enteredBy: string;
};

export type LeadFormData = {
  pincode: string;
  state: string;
  district: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  leadId: string;
  reference: string;
  email: string;
  company: string;
  headcount: string;
  sector: string;
  selectedModule: string;
  toDealer: boolean;
  creationDate: number;
  executiveViewDate?: number;
  followUps?: FollowUp[];
  nextFollowUpDate?: string;
  dealer?: string;
  manager?: string;
  executive?: string;
  givenBy?: string;
  status?: string;
  leadSubStatus?: string;
  subAdminId: string;
};

const sectors = ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Retail', 'Hospitality', 'Telecommunication', 'Construction', 'Real Estate', 'Media & Entertainment', 'Government', 'Non-profit', 'Other'];

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
    'Do Not Contact',
    'Quote Sent',
];

const initialFormState: Omit<LeadFormData, 'leadId' | 'creationDate' | 'subAdminId' | 'givenBy'> = {
    pincode: '',
    state: '',
    district: '',
    address: '',
    contactPerson: '',
    contactNumber: '',
    reference: '',
    email: '',
    company: '',
    headcount: '',
    sector: '',
    selectedModule: '',
    toDealer: false,
};

const saveLeadsToLocalStorage = (leads: LeadFormData[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('allLeads', JSON.stringify(leads));
    window.dispatchEvent(new Event('storage'));
  }
};

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};

export default function LeadUploadForm() {
  const [formData, setFormData] = useState<Omit<LeadFormData, 'leadId' | 'creationDate' | 'subAdminId' | 'givenBy'>>(initialFormState);
  const [sectorOpen, setSectorOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (formData.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
        .then(response => response.json())
        .then(data => {
          if (data && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              state: postOffice.State,
              district: postOffice.District,
            }));
            toast({
              title: 'Location Found',
              description: `State and District have been auto-filled for pincode ${formData.pincode}.`,
            });
          } else {
             setFormData(prev => ({
              ...prev,
              state: '',
              district: '',
            }));
            toast({
              variant: 'destructive',
              title: 'Invalid Pincode',
              description: `No details found for pincode ${formData.pincode}.`,
            });
          }
        })
        .catch(error => {
          console.error("Error fetching pincode details:", error);
          toast({
              variant: 'destructive',
              title: 'API Error',
              description: 'Could not fetch pincode details.',
            });
        });
    }
  }, [formData.pincode, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({...prev, toDealer: checked as boolean}));
  }

  const resetForm = () => {
    setFormData(initialFormState);
    handleCancel();
  };

  const validateLead = (lead: Omit<LeadFormData, 'leadId' | 'creationDate' | 'subAdminId' | 'givenBy'>) => {
    if (!lead.pincode || !lead.contactPerson || !lead.contactNumber || !lead.address) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill the fields',
      });
      return false;
    }
    return true;
  }

  const handleSaveLead = () => {
    if (!validateLead(formData)) {
      return;
    }
    
    const allLeads = getLeadsFromLocalStorage();
    const newLead: LeadFormData = {
      ...formData,
      leadId: `LEAD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      creationDate: new Date().getTime(),
      givenBy: 'Manual',
      subAdminId: 'demo-user', // Placeholder
      status: 'Not viewed',
    };

    const updatedLeads = [...allLeads, newLead];
    saveLeadsToLocalStorage(updatedLeads);

    toast({
      title: "Lead saved successfully",
      description: `Lead for ${newLead.company} has been saved.`,
    });
    resetForm();
  };

  const handleBrowseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setShowPreview(false);
      setParsedData(null);
    }
  };

  const processFile = (file: File, callback: (data: ParsedData) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: ParsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        callback(json);
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Error parsing file",
            description: "Could not read the file. Please ensure it's a valid Excel/CSV file.",
        });
      }
    };
    reader.readAsBinaryString(file);
  }

  const handlePreviewData = () => {
    if (!selectedFile) {
        toast({
            variant: "destructive",
            title: "No file selected",
            description: "Please select a file to preview.",
        });
      return;
    }
    if (parsedData) {
        setShowPreview(true);
    } else {
        processFile(selectedFile, (json) => {
          setParsedData(json);
          setShowPreview(true);
        });
    }
  };
  
  const handleConfirmUpload = () => {
    if (!parsedData) {
      toast({
        variant: 'destructive',
        title: 'No data to upload',
        description: 'Please select a file and preview first.',
      });
      return;
    }
     if (parsedData.length < 2) {
        toast({
          variant: 'destructive',
          title: 'Empty File',
          description: 'The selected file has no data rows.',
        });
        return;
      }
    
      const allLeads = getLeadsFromLocalStorage();
      const headers = parsedData[0].map(h => String(h).toLowerCase() === 'pin code' ? 'pincode' : String(h));

      const newLeads: LeadFormData[] = parsedData.slice(1).map(row => {
        const leadObject: any = {};
        headers.forEach((header, index) => {
            const headerStr = String(header);
            leadObject[headerStr] = row[index];
        });
        return {
            pincode: leadObject.pincode ? String(leadObject.pincode) : '',
            address: leadObject.address || '',
            contactPerson: leadObject.contactPerson || '',
            contactNumber: leadObject.contactNumber ? String(leadObject.contactNumber) : '',
            reference: leadObject.reference || '',
            email: leadObject.email || '',
            company: leadObject.company || '',
            headcount: leadObject.headcount ? String(leadObject.headcount) : '',
            sector: leadObject.sector || '',
            selectedModule: leadObject.selectedModule || '',
            state: leadObject.state || '',
            district: leadObject.district || '',
            toDealer: false,
            leadId: `LEAD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            creationDate: new Date().getTime(),
            givenBy: 'File Upload',
            status: 'Not viewed',
            subAdminId: 'demo-user' // Placeholder
        };
      });

      const updatedLeads = [...allLeads, ...newLeads];
      saveLeadsToLocalStorage(updatedLeads);
      
      toast({
        title: 'Leads saved successfully',
        description: `${newLeads.length} leads have been uploaded and saved.`,
      });
      resetForm();
  };


  const handleCancel = () => {
    setSelectedFile(null);
    setParsedData(null);
    setShowPreview(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

   const handleToExcel = () => {
    const allLeads = getLeadsFromLocalStorage();
    if (allLeads.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Leads to Export',
        description: 'There are no leads saved in the application yet.',
      });
      return;
    }

    const headers = ['Lead ID', 'Creation Date', 'Pincode', 'Company', 'Contact Person', 'Address', 'State', 'District', 'Contact Number', 'Email', 'Reference', 'Headcount', 'Sector', 'Selected Module'];
    
    const data = allLeads.map(lead => ({
      'Lead ID': lead.leadId,
      'Creation Date': format(new Date(lead.creationDate), 'yyyy-MM-dd'),
      'Pincode': lead.pincode,
      'Company': lead.company,
      'Contact Person': lead.contactPerson,
      'Address': lead.address,
      'State': lead.state,
      'District': lead.district,
      'Contact Number': lead.contactNumber,
      'Email': lead.email,
      'Reference': lead.reference,
      'Headcount': lead.headcount,
      'Sector': lead.sector,
      'Selected Module': lead.selectedModule,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });

    const colWidths = headers.map(header => ({ wch: Math.max(header.length, 20) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'Leads Upload report.xlsx');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold mb-4 text-primary">Provide the new Lead detail</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pincode">Pin code</Label>
            <Input id="pincode" value={formData.pincode} onChange={handleInputChange} maxLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={formData.company} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
          </div>
           <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={formData.state} onChange={(e) => handleSelectChange('state', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input id="district" value={formData.district} onChange={(e) => handleSelectChange('district', e.target.value)} />
          </div>
          <div className="space-y-2">
             <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
             <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" value={formData.reference} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headcount">Company headcount</Label>
            <Input id="headcount" value={formData.headcount} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Popover open={sectorOpen} onOpenChange={setSectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sectorOpen}
                  className="w-full justify-between font-normal"
                >
                  {formData.sector ? sectors.find(s => s.toLowerCase() === formData.sector.toLowerCase()) || "Select Sector..." : "Select Sector..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search sector..." />
                  <CommandList>
                    <CommandEmpty>No sector found.</CommandEmpty>
                    <CommandGroup>
                      {sectors.map((sector) => (
                        <CommandItem
                          key={sector}
                          value={sector.toLowerCase()}
                          onSelect={(currentValue) => {
                            const selectedSector = sectors.find(s => s.toLowerCase() === currentValue);
                            handleSelectChange('sector', selectedSector === formData.sector ? '' : selectedSector || '')
                            setSectorOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.sector === sector ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {sector}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="selectedModule">Modules</Label>
            <Select value={formData.selectedModule} onValueChange={(value) => handleSelectChange('selectedModule', value)}>
              <SelectTrigger id="selectedModule">
                <SelectValue placeholder="Select Modules..." />
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
          <div className="flex items-center space-x-2 pt-8 md:col-span-2">
            <Checkbox id="toDealer" checked={formData.toDealer} onCheckedChange={handleCheckboxChange} />
            <Label htmlFor="toDealer">To Dealer</Label>
            <span className="text-xs text-muted-foreground">As per Mapping</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={resetForm}>Reset</Button>
        <Button onClick={handleSaveLead}>Save Lead</Button>
        <Button variant="outline" onClick={handleToExcel}>TO EXCEL</Button>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <p className="font-semibold">Or upload leads from a file</p>
        <Card className="border-dashed">
            <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <p className="font-semibold">{selectedFile ? selectedFile.name : "Drag & Drop Excel/CSV file"}</p>
                    <p className="text-sm text-muted-foreground">or</p>
                    <div className='flex gap-2'>
                        <Button variant="outline" size="sm" onClick={handleBrowseFileClick}>Browse File</Button>
                    </div>
                    <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-start gap-2">
          <Button variant="secondary" onClick={handlePreviewData} disabled={!selectedFile}>Preview data</Button>
          <Button onClick={handleConfirmUpload} disabled={!selectedFile}>Confirm Upload</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={!selectedFile}>Cancel</Button>
        </div>
      </div>

       {showPreview && parsedData && (
        <div className="space-y-4">
            <h3 className="font-semibold">Data Preview</h3>
            <Card>
                <CardContent className='p-0'>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {parsedData.length > 0 && (
                                <TableRow>
                                    {parsedData[0].map((header, index) => (
                                        <TableHead key={index}>{String(header)}</TableHead>
                                    ))}
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {parsedData.slice(1).map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell key={cellIndex}>{cell}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </div>
      )}

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
                            readOnly
                            className="bg-muted"
                          />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="font-semibold shrink-0">Current Status: N/A</span>
                        <Select disabled>
                        <SelectTrigger className="w-full min-w-[200px]">
                            <SelectValue placeholder="-- Select --" />
                        </SelectTrigger>
                        <SelectContent>
                            {leadStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <Button disabled>Update</Button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Textarea 
                        id="initial-remarks"
                        placeholder="Enter remarks..."
                        className="min-h-[40px]"
                        disabled
                    />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    