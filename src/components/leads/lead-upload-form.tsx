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
import { Check, ChevronsUpDown, UploadCloud } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
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
  leadStatusRemarks?: string;
  initialRemarks?: string;
};

const sectors = ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Retail', 'Hospitality', 'Telecommunication', 'Construction', 'Real Estate', 'Media & Entertainment', 'Government', 'Non-profit', 'Other'];
const executiveNames = ['aishwarya', 'hukum', 'mandanna', 'yathish'];


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
    initialRemarks: '',
    dealer: '',
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
  const [dealerOpen, setDealerOpen] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      executive: formData.toDealer ? formData.dealer : undefined,
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
      setParsedData(null);
      setShowPreview(false);
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
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a file to upload.',
      });
      return;
    }

    processFile(selectedFile, (json) => {
      if (json.length < 2) {
        toast({
          variant: 'destructive',
          title: 'Empty File',
          description: 'The selected file has no data to populate the form.',
        });
        return;
      }
    
      const headers: string[] = json[0].map(h => String(h).toLowerCase().replace(/\s+/g, '') === 'pincode' ? 'pincode' : String(h).replace(/\s+/g, ''));
      const firstRow = json[1];

      const leadObject: any = {};
      headers.forEach((header, index) => {
          const headerStr = String(header).toLowerCase().replace(/\s+/g, '');
          // Map excel headers to form keys
          const keyMap: {[key: string]: keyof LeadFormData} = {
              'pin code': 'pincode',
              pincode: 'pincode',
              company: 'company',
              contactperson: 'contactPerson',
              address: 'address',
              state: 'state',
              district: 'district',
              contactnumber: 'contactNumber',
              email: 'email',
              reference: 'reference',
              companyheadcount: 'headcount',
              sector: 'sector',
              modules: 'selectedModule'
          };
          const formKey = keyMap[headerStr];
          if(formKey) {
             leadObject[formKey] = firstRow[index];
          }
      });
      
      setFormData(prev => ({
        ...prev,
        ...leadObject,
        pincode: String(leadObject.pincode || ''),
        contactNumber: String(leadObject.contactNumber || ''),
        headcount: String(leadObject.headcount || ''),
      }));
      
      toast({
        title: 'Form Populated',
        description: `The form has been filled with the first lead from ${selectedFile.name}.`,
      });
      handleCancel(); // Reset file input after populating
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="initialRemarks">Initial Remark</Label>
            <Textarea
              id="initialRemarks"
              value={formData.initialRemarks || ''}
              onChange={handleInputChange}
              placeholder="Enter initial remarks here..."
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="toDealer" checked={formData.toDealer} onCheckedChange={handleCheckboxChange} />
            <Label htmlFor="toDealer">To Dealer</Label>
          </div>

           {formData.toDealer && (
            <div className="space-y-2">
                <Label htmlFor="dealer">Dealer</Label>
                 <Popover open={dealerOpen} onOpenChange={setDealerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={dealerOpen}
                        className="w-full justify-between font-normal"
                        >
                        {formData.dealer || "As per mapping"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandList>
                            <CommandEmpty>No executives found.</CommandEmpty>
                            <CommandGroup>
                            {executiveNames.map((name) => (
                                <CommandItem
                                key={name}
                                value={name}
                                onSelect={(currentValue) => {
                                    handleSelectChange('dealer', currentValue === formData.dealer ? '' : currentValue)
                                    setDealerOpen(false)
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.dealer === name ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={resetForm}>Reset</Button>
        <Button onClick={handleSaveLead}>Save Lead</Button>
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
    </div>
  );
}

    