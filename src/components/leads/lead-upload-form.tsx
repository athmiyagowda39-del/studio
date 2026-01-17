
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
import { Button } from '@/components/ui/button';
import { Download, UploadCloud } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
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
import { Textarea } from '../ui/textarea';
import type { AppUser } from '@/context/users-context';
import { Checkbox } from '../ui/checkbox';

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
  toExecutive: boolean;
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
  initialRemarks?: string;
};

const sectors = ['All', 'IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Retail', 'Hospitality', 'Telecommunication', 'Construction', 'Real Estate', 'Media & Entertainment', 'Government', 'Non-profit', 'Other'];
const references = [
    "All", "Website", "Social Media", "Google Ads", "Facebook Ads", "LinkedIn", "Referral", "Cold Call",
    "Telecalling", "Walk-in", "Email Campaign", "WhatsApp Campaign", "IndiaMART", "Justdial", "Channel Partner",
    "Existing Customer", "Upselling", "Cross-selling", "Events / Trade Shows", "Demo Request", "Trial Signup", "Other"
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
    toExecutive: false,
    initialRemarks: '',
    dealer: '',
    executive: '',
    manager: '',
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

const getNextLeadId = (): string => {
  const leads = getLeadsFromLocalStorage();
  if (leads.length === 0) {
    return '100000';
  }
  const maxId = leads.reduce((max, lead) => {
    const leadIdNum = parseInt(lead.leadId, 10);
    return !isNaN(leadIdNum) && leadIdNum > max ? leadIdNum : max;
  }, 99999);
  return (maxId + 1).toString();
}


export default function LeadUploadForm() {
  const [formData, setFormData] = useState<Omit<LeadFormData, 'leadId' | 'creationDate' | 'subAdminId' | 'givenBy'>>(initialFormState);
  const [toExecutiveSelection, setToExecutiveSelection] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const hardcodedExecutives = ["All", "Yathish G", "Mandanna N", "Hukum Chand Kewath", "Hemant Sharma"];

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
    setFormData(prev => ({...prev, toExecutive: checked as boolean}));
     if (!checked) {
      setToExecutiveSelection('');
    }
  }

  const resetForm = () => {
    setFormData(initialFormState);
    setToExecutiveSelection('');
    handleCancel();
  };

  const validateLead = (lead: Omit<LeadFormData, 'leadId' | 'creationDate' | 'subAdminId' | 'givenBy'>) => {
    const requiredFields: (keyof typeof lead)[] = [
      'pincode', 'company', 'contactPerson', 'address', 'state', 'district', 
      'contactNumber', 'email', 'reference', 'headcount', 'sector', 
      'selectedModule', 'manager'
    ];
    
    for (const field of requiredFields) {
      if (!lead[field]) {
        toast({
          variant: 'destructive',
          title: 'Missing Information',
          description: `Please fill all required fields before saving. Missing: ${field}`,
        });
        return false;
      }
    }
    
    if (lead.toExecutive && !toExecutiveSelection) {
       toast({
          variant: 'destructive',
          title: 'Missing Information',
          description: 'Please select an executive from the "To Executive" dropdown.',
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
      leadId: getNextLeadId(),
      creationDate: new Date().getTime(),
      givenBy: 'Manual',
      status: 'Not viewed',
      executive: formData.toExecutive ? toExecutiveSelection : undefined,
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
      processFileAndUpload(file);
    }
  };

  const processFileAndUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: ParsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length < 2) {
          toast({ variant: "destructive", title: "Empty File", description: "The file has no data rows." });
          return;
        }

        const headers: string[] = json[0].map(h => String(h).toLowerCase().replace(/\s+/g, ''));
        const leadsToCreate = json.slice(1).map(row => {
          const leadObject: any = {};
           headers.forEach((header, index) => {
              const keyMap: {[key: string]: keyof Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy' | 'status'>} = {
                  'pincode': 'pincode', 'company': 'company', 'contactperson': 'contactPerson',
                  'address': 'address', 'state': 'state', 'district': 'district',
                  'contactnumber': 'contactNumber', 'email': 'email', 'reference': 'reference',
                  'companyheadcount': 'headcount', 'sector': 'sector', 'modules': 'selectedModule',
                  'executive': 'executive', 'manager': 'manager',
              };
              const formKey = keyMap[header];
              if(formKey) leadObject[formKey] = row[index];
          });
          return leadObject;
        });

        const allLeads = getLeadsFromLocalStorage();
        let nextId = parseInt(getNextLeadId(), 10);
        
        const newLeads: LeadFormData[] = leadsToCreate.map(ld => {
          const lead: LeadFormData = {
            ...initialFormState,
            ...ld,
            pincode: String(ld.pincode || ''),
            contactNumber: String(ld.contactNumber || ''),
            headcount: String(ld.headcount || ''),
            leadId: (nextId++).toString(),
            creationDate: Date.now(),
            givenBy: 'Bulk Upload',
            status: 'Not viewed',
          };
          return lead;
        });

        const updatedLeads = [...allLeads, ...newLeads];
        saveLeadsToLocalStorage(updatedLeads);

        toast({
          title: "Bulk Upload Successful",
          description: `${newLeads.length} leads have been successfully uploaded.`,
        });

        handleCancel();

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

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleDownloadSample = () => {
    const sampleData = [
      ['pincode', 'company', 'contactPerson', 'address', 'state', 'district', 'contactNumber', 'email', 'reference', 'headcount', 'sector', 'selectedModule', 'manager', 'executive'],
      ['560001', 'Sample Corp', 'John Doe', '123 Main St', 'Karnataka', 'Bengaluru', '9876543210', 'john.doe@example.com', 'Website', '150', 'IT', 'all-hrms', 'Jane Smith', 'Yathish G']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, 'SampleLeads.xlsx');
  }

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
             <Select value={formData.reference} onValueChange={(value) => handleSelectChange('reference', value)}>
                <SelectTrigger id="reference">
                    <SelectValue placeholder="Select Reference..."/>
                </SelectTrigger>
                <SelectContent>
                    {references.map((ref) => (
                        <SelectItem key={ref} value={ref}>
                            {ref}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headcount">Company headcount</Label>
            <Input id="headcount" value={formData.headcount} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Select value={formData.sector} onValueChange={(value) => handleSelectChange('sector', value)}>
                <SelectTrigger id="sector">
                    <SelectValue placeholder="Select Sector..."/>
                </SelectTrigger>
                <SelectContent>
                    {sectors.map((sector) => (
                        <SelectItem key={sector} value={sector.toLowerCase()}>
                            {sector}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="selectedModule">Modules</Label>
            <Select value={formData.selectedModule} onValueChange={(value) => handleSelectChange('selectedModule', value)}>
              <SelectTrigger id="selectedModule">
                <SelectValue placeholder="Select Modules..." />
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
              <Input id="manager" value={formData.manager || ''} onChange={handleInputChange} />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="initialRemarks">Initial Remarks</Label>
            <Textarea id="initialRemarks" value={formData.initialRemarks || ''} onChange={handleInputChange} />
          </div>

        </div>
      </div>
      <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="toExecutive"
              checked={formData.toExecutive}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="toExecutive">To Executive</Label>
          </div>
          {formData.toExecutive && (
              <div className="w-full md:w-auto">
                <Select value={toExecutiveSelection} onValueChange={setToExecutiveSelection}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Executive..." />
                  </SelectTrigger>
                  <SelectContent>
                    {hardcodedExecutives.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSaveLead}>SAVE</Button>
          <Button variant="outline" onClick={resetForm}>RESET</Button>
        </div>
      </div>


      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="text-lg font-medium">Or upload leads from a file</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                 <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                 <p className="mt-4 font-semibold">Drag & Drop Excel/CSV file</p>
                 <p className="text-sm text-muted-foreground mt-1">or</p>
                 <div className="flex items-center gap-4 mt-4">
                    <Button variant="outline" onClick={handleBrowseFileClick}>Browse File</Button>
                    <Button variant="ghost" onClick={handleDownloadSample}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Sample
                    </Button>
                 </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
            />
        </CardContent>
      </Card>
    </div>
  );
}
