
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
import { pincodeData } from '@/lib/pincodes';
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
import { useAuthContext } from '@/context/auth-context';

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
  leadStatusRemarks?: string;
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
    'Existing Customer',
    'Do Not Contact',
    'Quote Sent',
];

const initialFormState: Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy'> = {
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


export default function LeadUploadForm() {
  const authContext = useAuthContext();
  const [formData, setFormData] = useState<Omit<LeadFormData, 'leadId' | 'creationDate'>>(initialFormState);
  const [addedLeads, setAddedLeads] = useState<Omit<LeadFormData, 'leadId' | 'creationDate'>[]>([]);
  const [sectorOpen, setSectorOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [leadIdForStatus, setLeadIdForStatus] = useState('');
  const [leadIdForStatusOpen, setLeadIdForStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Initial');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [initialRemarks, setInitialRemarks] = useState('');

  useEffect(() => {
    try {
      const storedLeads = localStorage.getItem('uploadedLeads');
      if (storedLeads) {
        setAllLeads(JSON.parse(storedLeads));
      }
    } catch (error) {
      console.error('Failed to parse leads from localStorage', error);
    }
     const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'uploadedLeads') {
         try {
            const storedLeads = localStorage.getItem('uploadedLeads');
            if (storedLeads) {
                setAllLeads(JSON.parse(storedLeads));
            }
         } catch (error) {
             console.error('Failed to parse leads from localStorage on update', error);
         }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPincode = e.target.value;
    const newFormData = { ...formData, pincode: newPincode };

    const location = pincodeData[newPincode];
    if (location) {
        newFormData.state = location.state;
        newFormData.district = location.district;
    } else {
        newFormData.state = '';
        newFormData.district = '';
    }
    setFormData(newFormData);
  };

  const handleHeadcountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeadcount = e.target.value;
    setFormData(prev => ({ ...prev, headcount: newHeadcount }));
  };
  
  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({...prev, toDealer: checked as boolean}));
  }

  const resetForm = () => {
    setFormData(initialFormState);
    setAddedLeads([]);
    handleCancel();
  };

  const validateLead = (lead: Omit<LeadFormData, 'leadId' | 'creationDate'>) => {
    if (!lead.pincode || !lead.contactPerson || !lead.contactNumber || !lead.address) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill all mandatory fields.',
      });
      return false;
    }
    return true;
  }

  const saveLeadsToLocalStorage = (leads: LeadFormData[]) => {
    try {
      const existingLeadsJson = localStorage.getItem('uploadedLeads');
      const existingLeads: LeadFormData[] = existingLeadsJson ? JSON.parse(existingLeadsJson) : [];
      const updatedLeads = [...existingLeads, ...leads];
      localStorage.setItem('uploadedLeads', JSON.stringify(updatedLeads));
      window.dispatchEvent(new Event('storage')); // Notify other components of the change
    } catch (error) {
      console.error("Could not save leads to localStorage", error);
      toast({
        variant: "destructive",
        title: "Storage Error",
        description: "Could not save leads. Your browser might be in private mode or has storage disabled.",
      });
    }
  }

  const handleSaveLeads = (leadsToSave?: Omit<LeadFormData, 'leadId' | 'creationDate'>[]) => {
    const formHasData = Object.values(formData).some(value => value !== '' && value !== false);
    let leadsToProcess: Omit<LeadFormData, 'leadId' | 'creationDate'>[] = leadsToSave || [];

    if (formHasData && !leadsToSave) {
        if (!validateLead(formData)) return;
        leadsToProcess.push(formData);
    }
    
    if(!leadsToSave) {
        leadsToProcess = [...leadsToProcess, ...addedLeads];
    }


    if (leadsToProcess.length === 0) {
         toast({
            variant: "destructive",
            title: "No leads to save",
            description: "Please add or enter at least one valid lead before saving.",
        });
        return;
    }

    const leadsWithIds = leadsToProcess.map((lead, index) => {
        const now = Date.now();
        return {
            ...lead,
            leadId: `LEAD-${now}-${index}`,
            creationDate: now,
            status: 'Not viewed', // Default status for new leads
            givenBy: lead.givenBy || authContext?.user?.username
        };
    });

    saveLeadsToLocalStorage(leadsWithIds as LeadFormData[]);
    
    toast({
        title: "Leads added successfully",
        description: `${leadsWithIds.length} lead(s) have been successfully saved.`,
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
      setAddedLeads([]);
      toast({
        title: "File Selected",
        description: `${file.name}. Click 'Preview data' or 'Confirm Upload'.`,
      });
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
    processFile(selectedFile, (json) => {
      setParsedData(json);
      setShowPreview(true);
    });
  };
  
  const handleConfirmUpload = () => {
    if (!selectedFile) {
        toast({
            variant: "destructive",
            title: "No file selected",
            description: "Please select a file to upload.",
        });
      return;
    }
    
    processFile(selectedFile, (json) => {
        if (json.length < 2) {
            toast({
                variant: "destructive",
                title: "Empty File",
                description: "The selected file has no data rows.",
            });
            return;
        }

        const headers = (json[0] as string[]).map(h => h.toString().trim());
        const lowerCaseHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, ''));
        
        const leadsFromFile: Omit<LeadFormData, 'leadId' | 'creationDate'>[] = json.slice(1).map((row: any[]) => {
            const lead: any = {};
            lowerCaseHeaders.forEach((header, index) => {
                lead[header] = row[index];
            });
            const location = pincodeData[lead.pincode];

            return {
                pincode: lead.pincode?.toString() || '',
                state: location?.state || '',
                district: location?.district || '',
                address: lead.address || '',
                contactPerson: lead.contactperson || '',
                contactNumber: lead.contactnumber?.toString() || '',
                reference: lead.reference || '',
                email: lead.email || '',
                company: lead.company || '',
                headcount: lead.headcount?.toString() || '',
                sector: lead.sector || '',
                selectedModule: lead.selectedmodule || lead.module || '',
                toDealer: false, // Default value
            };
        });

        if (leadsFromFile.length > 0) {
            handleSaveLeads(leadsFromFile);
        } else {
             toast({
                variant: "destructive",
                title: "No leads found",
                description: "The file does not contain any leads to upload.",
            });
        }
      });
  };


  const handleCancel = () => {
    setSelectedFile(null);
    setParsedData(null);
    setShowPreview(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

   const handleDownloadSample = () => {
    const sampleData = [
      ['pincode', 'address', 'contactPerson', 'contactNumber', 'reference', 'email', 'company', 'headcount', 'sector', 'selectedModule'],
      ['587101', '123 MG Road, Bagalkote', 'John Doe', '9876543210', 'Friend', 'john.doe@example.com', 'Tech Solutions', '150', 'IT', 'ar'],
      ['560001', '456 Brigade Road, Bengaluru', 'Jane Smith', '8765432109', 'Website', 'jane.smith@example.com', 'Innovate Corp', '250', 'Finance', 'all-hrms'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'sample_leads.xlsx');
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
                status: selectedStatus,
                leadStatusRemarks: initialRemarks,
            };
        }
        return lead;
    });

    setAllLeads(updatedLeads);
    localStorage.setItem('uploadedLeads', JSON.stringify(updatedLeads));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Status Updated',
      description: `Lead ${leadIdForStatus} status updated to ${selectedStatus}.`,
    });

    setInitialRemarks('');
    setSelectedStatus('');
  };


  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold">Provide the new Lead detail</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="pincode">Pin code <span className="text-destructive">*</span></Label>
            <Input id="pincode" value={formData.pincode} onChange={handlePincodeChange} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={formData.company} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person <span className="text-destructive">*</span></Label>
            <Input id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
            <Input id="address" value={formData.address} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={formData.state} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input id="district" value={formData.district} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number <span className="text-destructive">*</span></Label>
            <Input id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required />
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
            <Input id="headcount" value={formData.headcount} onChange={handleHeadcountChange} />
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
            <Label htmlFor="modules">Modules</Label>
            <Select value={formData.selectedModule} onValueChange={(value) => handleSelectChange('selectedModule', value)}>
              <SelectTrigger id="modules">
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
          <div className="col-span-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="toDealer" checked={formData.toDealer} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="toDealer">To Dealer</Label>
              <span className="text-xs text-muted-foreground">As per Mapping</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={resetForm}>Reset</Button>
        <Button onClick={() => handleSaveLeads()}>Save Lead</Button>
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
                         <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Sample
                        </Button>
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
                                        <TableHead key={index}>{header}</TableHead>
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

      <Card className="mt-6">
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
    </div>
  );
}
