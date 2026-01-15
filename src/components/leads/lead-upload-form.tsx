
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
import { UploadCloud } from 'lucide-react';
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
    "Email Campaign", "WhatsApp Campaign", "Walk-in", "Telecalling", "Events / Trade Shows", "Webinars",
    "Channel Partner", "Reseller", "Distributor", "Existing Customer", "Upselling", "Cross-selling",
    "Marketplace (Justdial / IndiaMART)", "Third-party Data", "Outdoor Marketing", "Newspaper Ads",
    "TV / Radio Ads", "Direct Sales", "Field Sales", "Franchise", "Customer Support", "Demo Request", "Trial Signup", "Job Portal"
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

const getUsersFromLocalStorage = (): AppUser[] => {
  if (typeof window !== 'undefined') {
    const usersJson = localStorage.getItem('appUsers');
    return usersJson ? JSON.parse(usersJson) : [];
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
  const [executiveNames, setExecutiveNames] = useState<string[]>([]);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const users = getUsersFromLocalStorage();
    const executives = users.filter(u => u.role === 'Executive').map(u => u.username);
    setExecutiveNames(executives);

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'appUsers') {
            const updatedUsers = getUsersFromLocalStorage();
            const updatedExecutives = updatedUsers.filter(u => u.role === 'Executive').map(u => u.username);
            setExecutiveNames(updatedExecutives);
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
          description: 'Please fill all required fields before saving.',
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
      dealer: formData.toExecutive ? toExecutiveSelection : 'As per mapping',
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
          const keyMap: {[key: string]: keyof Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy' | 'status'>} = {
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
              modules: 'selectedModule',
              executive: 'executive',
              manager: 'manager',
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6 pt-6 border-t">
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
                <SelectTrigger>
                  <SelectValue placeholder="Select Executive..." />
                </SelectTrigger>
                <SelectContent>
                  {executiveNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        )}
        <div className="flex gap-2">
          <Button onClick={handleSaveLead}>SAVE</Button>
          <Button variant="outline" onClick={resetForm}>RESET</Button>
        </div>
      </div>


      <Card className="mt-8">
        <CardContent className="p-6">
          <p className="font-semibold text-primary">BULK UPLOAD</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a .xls or .xlsx file to upload multiple leads at once.
          </p>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4">
            <div
              className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 w-full md:w-auto cursor-pointer hover:bg-muted"
              onClick={handleBrowseFileClick}
            >
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : 'Click or drag file to this area to upload'}
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".xlsx, .xls"
            />
            <div className="flex gap-2 self-center">
              <Button onClick={handlePreviewData} disabled={!selectedFile}>Preview Data</Button>
              <Button onClick={handleConfirmUpload} disabled={!selectedFile}>Populate Form</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={!selectedFile}>Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
       {showPreview && parsedData && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">File Preview</h3>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {parsedData[0].map((header, index) => (
                      <TableHead key={index}>{String(header)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{String(cell)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

    