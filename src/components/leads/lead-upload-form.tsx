
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
import {
  Download,
  UploadCloud,
  Info,
  ChevronsUpDown,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../ui/card';
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
import { useUsers } from '@/context/users-context';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const sectors = [
  'All',
  'IT',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Education',
  'Retail',
  'Hospitality',
  'Telecommunication',
  'Construction',
  'Real Estate',
  'Media & Entertainment',
  'Government',
  'Non-profit',
  'Other',
];
const references = [
  'All',
  'Website',
  'Social Media',
  'Google Ads',
  'Facebook Ads',
  'LinkedIn',
  'Referral',
  'Cold Call',
  'Telecalling',
  'Walk-in',
  'Email Campaign',
  'WhatsApp Campaign',
  'IndiaMART',
  'Channel Partner',
  'Existing Customer',
  'Upselling',
  'Cross-selling',
  'Events / Trade Shows',
  'Demo Request',
  'Trial Signup',
  'Other',
];

const hrCoreModules = [
  'Manpower Resource Planning',
  'Recruitment and Requisition Management',
  'Onboarding',
  'Letter Generation',
  'Leave Management',
];

const attendanceSubModules = [
  'Desktop Attendance Marking Only',
  'Integration with Attendance Machine',
  'Mobile Attendance Marking without Location',
  'Geo Fencing',
  'Geo Tracking',
];

const hrExtendedModules = [
  'Shift Roaster Management',
  'Timesheet Management',
  'Performance Management',
  'Training Management',
  'Employee Movement / Transfer',
  'Probation to Confirmation',
  'Employee Database Management',
  'Mobile App',
  'Employee Self Service',
];

const financeModules = ['Payroll', 'Separation', 'Travel and Expense'];

const generalModules = [
  'Broadcast | Survey',
  'Query Management',
  'Asset Tracking',
  'Rewards Recognition',
  'Organogram',
  'Declaration | Reprimands',
  'Ex-Employee Portal',
];

const allModules = [
  ...hrCoreModules,
  'Attendance Management',
  ...attendanceSubModules,
  ...hrExtendedModules,
  ...financeModules,
  ...generalModules,
].sort();

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
  toExecutive: false,
  initialRemarks: '',
  dealer: '',
  executive: '',
  manager: '',
};

const saveLeadsToLocalStorage = (leads: LeadFormData[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('allLeads', JSON.stringify(leads));
    window.dispatchEvent(new CustomEvent('leadsUpdated'));
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
};

export default function LeadUploadForm() {
  const [formData, setFormData] = useState<
    Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy'>
  >(initialFormState);
  const [parsedLeads, setParsedLeads] = useState<Partial<LeadFormData>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [toExecutiveSelection, setToExecutiveSelection] = useState('');
  const [otherReferenceInput, setOtherReferenceInput] = useState('');
  const [otherSectorInput, setOtherSectorInput] = useState('');
  const [otherToExecutiveInput, setOtherToExecutiveInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const { users } = useUsers();
  const { user, isReadOnly, isImpersonating } = useAuth();
  const [executives, setExecutives] = useState<string[]>([]);

  const isExecutiveContext = user?.role === 'Executive';

  // State for the multi-select UI
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Effect to update formData when UI selection changes
  useEffect(() => {
    handleSelectChange('selectedModule', selectedModules.join(', '));
  }, [selectedModules]);

  // Effect to reset UI when form is reset
  useEffect(() => {
    if (formData.selectedModule === '') {
      setSelectedModules([]);
    }
  }, [formData.selectedModule]);


  useEffect(() => {
    const executiveUsers = users
      .filter((user) => user.role === 'Executive')
      .map((user) => user.username);
    setExecutives(executiveUsers);
  }, [users]);

  useEffect(() => {
    if (isImpersonating && user?.role === 'Executive') {
      setFormData((prev) => ({ ...prev, toExecutive: true }));
      setToExecutiveSelection(user.username);
    } else if (user?.role === 'Executive') {
      setFormData((prev) => ({ ...prev, toExecutive: true }));
      setToExecutiveSelection(user.username);
    } else {
      // Reset when not in an executive context (e.g., admin logs in or stops impersonating)
      setFormData((prev) => ({ ...prev, toExecutive: false }));
      setToExecutiveSelection('');
    }
  }, [user, isImpersonating]);

  useEffect(() => {
    if (formData.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
        .then((response) => response.json())
        .then((data) => {
          if (data && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setFormData((prev) => ({
              ...prev,
              state: postOffice.State,
              district: postOffice.District,
            }));
            toast({
              title: 'Location Found',
              description: `State and District have been auto-filled for pincode ${formData.pincode}.`,
            });
          } else {
            setFormData((prev) => ({
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
        .catch((error) => {
          console.error('Error fetching pincode details:', error);
          toast({
            variant: 'destructive',
            title: 'API Error',
            description: 'Could not fetch pincode details.',
          });
        });
    }
  }, [formData.pincode, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, toExecutive: checked as boolean }));
    if (!checked) {
      setToExecutiveSelection('');
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    if (!isExecutiveContext && !isImpersonating) {
      setToExecutiveSelection('');
    }
    handleCancelUpload();
  };

  const validateLead = (
    lead: Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy'>
  ) => {
    // Specific check for module
    if (!lead.selectedModule) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a module.',
      });
      return false;
    }

    const requiredFields: (keyof typeof lead)[] = [
      'pincode',
      'company',
      'contactPerson',
      'address',
      'state',
      'district',
      'contactNumber',
      'email',
      'reference',
      'headcount',
      'sector',
      'manager',
    ];

    for (const field of requiredFields) {
      if (!lead[field]) {
        toast({
          variant: 'destructive',
          title: 'Missing Information',
          description: 'Please fill all required fields.',
        });
        return false;
      }
    }

    if (lead.reference === 'Other') {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: "Please specify a value for 'Other' reference.",
      });
      return false;
    }
    if (lead.sector === 'Other') {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: "Please specify a value for 'Other' sector.",
      });
      return false;
    }

    if (lead.toExecutive && !toExecutiveSelection) {
      toast({
        variant: 'destructive',
        title: 'Executive Not Assigned',
        description: 'You must select an executive when "To Executive" is checked.',
      });
      return false;
    }
    if (formData.toExecutive && toExecutiveSelection === 'Other') {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: "Please specify a value for 'Other' in the 'To Executive' field.",
      });
      return false;
    }

    return true;
  };

  const handleSaveLead = () => {
    if (!validateLead(formData)) {
      return;
    }

    const allLeads = getLeadsFromLocalStorage();
    const newLead: LeadFormData = {
      ...formData,
      givenBy: user?.username || 'Manual',
      leadId: getNextLeadId(),
      creationDate: new Date().getTime(),
      status: 'Not viewed',
      executive: formData.toExecutive ? toExecutiveSelection : undefined,
    };

    const updatedLeads = [...allLeads, newLead];
    saveLeadsToLocalStorage(updatedLeads);

    toast({
      title: 'Lead saved successfully',
      description: `Lead for ${newLead.company} has been saved.`,
    });
    resetForm();
  };

  const handleBrowseFileClick = () => {
    if (isReadOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
        const json: ParsedData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });

        if (json.length < 2) {
          toast({
            variant: 'destructive',
            title: 'Empty File',
            description: 'The file has no data rows to import.',
          });
          return;
        }

        const headers: string[] = (json[0] as string[]).map((h) =>
          String(h).toLowerCase().replace(/\s+/g, '')
        );
        const keyMap: { [key: string]: keyof Partial<LeadFormData> } = {
          pincode: 'pincode',
          company: 'company',
          contactperson: 'contactPerson',
          address: 'address',
          state: 'state',
          district: 'district',
          contactnumber: 'contactNumber',
          email: 'email',
          reference: 'reference',
          headcount: 'headcount',
          sector: 'sector',
          selectedmodule: 'selectedModule',
          manager: 'manager',
          executive: 'executive',
        };

        const leadsData = json
          .slice(1)
          .map((row) => {
            const leadObject: Partial<LeadFormData> = {};
            if (Array.isArray(row) && row.length > 0) {
              headers.forEach((header, index) => {
                const formKey = keyMap[header];
                if (formKey) {
                  (leadObject as any)[formKey] = row[index];
                }
              });
            }
            return leadObject;
          })
          .filter((lead) => Object.keys(lead).length > 0);

        if (leadsData.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Data Found',
            description:
              'The file appears to be empty or formatted incorrectly.',
          });
          return;
        }

        setParsedLeads(leadsData);
        setShowPreview(false);

        toast({
          title: `File Processed: ${leadsData.length} leads found.`,
          description:
            "Review the data below and click 'Confirm Upload' to save.",
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error parsing file',
          description:
            "Could not read the file. Please ensure it's a valid Excel/CSV file with correct headers.",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmUpload = () => {
    if (parsedLeads.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'There is no data to upload.',
      });
      return;
    }

    const allLeads = getLeadsFromLocalStorage();
    let nextId = parseInt(getNextLeadId(), 10);

    const newLeads: LeadFormData[] = parsedLeads.map((parsedLead) => {
      const newLead: LeadFormData = {
        pincode: parsedLead.pincode || '',
        state: parsedLead.state || '',
        district: parsedLead.district || '',
        address: parsedLead.address || '',
        contactPerson: parsedLead.contactPerson || '',
        contactNumber: String(parsedLead.contactNumber || ''),
        reference: parsedLead.reference || '',
        email: parsedLead.email || '',
        company: parsedLead.company || '',
        headcount: String(parsedLead.headcount || ''),
        sector: parsedLead.sector || '',
        selectedModule: parsedLead.selectedModule || '',
        manager: parsedLead.manager || '',
        executive: parsedLead.executive || '',
        toExecutive: !!parsedLead.executive,
        // new fields
        leadId: (nextId++).toString(),
        creationDate: new Date().getTime(),
        givenBy: user?.username || 'File Upload',
        status: 'Not viewed',
      };
      return newLead;
    });

    const updatedLeads = [...allLeads, ...newLeads];
    saveLeadsToLocalStorage(updatedLeads);

    toast({
      title: 'Upload Successful',
      description: `${newLeads.length} leads have been successfully uploaded and saved.`,
    });

    handleCancelUpload(); // Reset UI
  };

  const handleCancelUpload = () => {
    setParsedLeads([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) return;
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) return;
    if (isDragging) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isReadOnly) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf('.'))
        .toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        processFileAndUpload(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid Excel or CSV file.',
        });
      }
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      [
        'pincode',
        'company',
        'contactPerson',
        'address',
        'state',
        'district',
        'contactNumber',
        'email',
        'reference',
        'headcount',
        'sector',
        'selectedModule',
        'manager',
        'executive',
      ],
      [
        '560001',
        'Sample Corp',
        'John Doe',
        '123 Main St',
        'Karnataka',
        'Bengaluru',
        '9876543210',
        'john.doe@example.com',
        'Website',
        '150',
        'IT',
        'Payroll,Recruitment and Requisition Management',
        'Jane Smith',
        'Yathish G',
      ],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, 'SampleLeads.xlsx');
  };

  const handleSetOtherReference = () => {
    if (otherReferenceInput.trim()) {
      const newRef = otherReferenceInput.trim();
      handleSelectChange('reference', newRef);
      setOtherReferenceInput('');
    }
  };

  const handleSetOtherSector = () => {
    if (otherSectorInput.trim()) {
      const newSector = otherSectorInput.trim();
      handleSelectChange('sector', newSector);
      setOtherSectorInput('');
    }
  };

  const handleSetOtherToExecutive = () => {
    if (otherToExecutiveInput.trim()) {
      const newExec = otherToExecutiveInput.trim();
      setToExecutiveSelection(newExec);
      setOtherToExecutiveInput('');
    }
  };

  const handleModuleSelect = (module: string, checked: boolean) => {
    if (module === 'All') {
      setSelectedModules(checked ? [...allModules] : []);
    } else {
      if (checked) {
        setSelectedModules((prev) => [...prev, module]);
      } else {
        setSelectedModules((prev) => prev.filter((m) => m !== module));
      }
    }
  };


  return (
    <div className="space-y-6">
      {isReadOnly && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Read-Only Mode</AlertTitle>
          <AlertDescription>
            You are viewing this page in read-only mode. No new leads can be
            created while impersonating a user.
          </AlertDescription>
        </Alert>
      )}
      <div>
        <p className="font-semibold mb-4 text-primary">
          Provide the new Lead detail
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pincode">Pin code</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              maxLength={6}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleSelectChange('state', e.target.value)}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) => handleSelectChange('district', e.target.value)}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Select
              value={formData.reference}
              onValueChange={(value) => handleSelectChange('reference', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="reference">
                {formData.reference && !references.includes(formData.reference) ? (
                  <span className="truncate">{formData.reference}</span>
                ) : (
                  <SelectValue placeholder="Select Reference..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {references.map((ref) => (
                  <SelectItem key={ref} value={ref} onClick={() => handleSelectChange('reference', ref)}>
                    {ref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.reference === 'Other' && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  placeholder="Specify other reference"
                  value={otherReferenceInput}
                  onChange={(e) => setOtherReferenceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSetOtherReference();
                  }}
                  disabled={isReadOnly}
                />
                <Button
                  size="sm"
                  onClick={handleSetOtherReference}
                  disabled={isReadOnly}
                >
                  OK
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="headcount">Company headcount</Label>
            <Input
              id="headcount"
              value={formData.headcount}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Select
              value={formData.sector}
              onValueChange={(value) => handleSelectChange('sector', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="sector">
                {formData.sector && !sectors.includes(formData.sector) ? (
                  <span className="truncate">{formData.sector}</span>
                ) : (
                  <SelectValue placeholder="Select Sector..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.sector === 'Other' && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  placeholder="Specify other sector"
                  value={otherSectorInput}
                  onChange={(e) => setOtherSectorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSetOtherSector();
                  }}
                  disabled={isReadOnly}
                />
                <Button
                  size="sm"
                  onClick={handleSetOtherSector}
                  disabled={isReadOnly}
                >
                  OK
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectedModule">Modules</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                  disabled={isReadOnly}
                >
                  <span className="truncate">
                    {selectedModules.length === 0
                      ? 'Select Module(s)...'
                      : selectedModules.length === 1
                      ? selectedModules[0]
                      : `${selectedModules.length} modules selected`}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <ScrollArea className="h-72">
                  <DropdownMenuCheckboxItem
                    checked={selectedModules.length === allModules.length}
                    onCheckedChange={(checked) =>
                      handleModuleSelect('All', !!checked)
                    }
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {allModules.map((module) => (
                    <DropdownMenuCheckboxItem
                      key={module}
                      checked={selectedModules.includes(module)}
                      onCheckedChange={(checked) =>
                        handleModuleSelect(module, !!checked)
                      }
                    >
                      {module}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <div className="relative">
              <Input
                id="manager"
                value={formData.manager || ''}
                onChange={handleInputChange}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="initialRemarks">Initial Remarks</Label>
            <Textarea
              id="initialRemarks"
              value={formData.initialRemarks || ''}
              onChange={handleInputChange}
              readOnly={isReadOnly}
            />
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
              disabled={isExecutiveContext || isImpersonating || isReadOnly}
            />
            <Label htmlFor="toExecutive">To Executive</Label>
          </div>
          {formData.toExecutive && (
            <div className="w-full md:w-auto">
              {isExecutiveContext || isImpersonating ? (
                <Input
                  value={toExecutiveSelection}
                  readOnly
                  className="w-[200px] bg-muted"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <Select
                    value={toExecutiveSelection}
                    onValueChange={setToExecutiveSelection}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="As per mapping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {executives.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                      {!executives.includes(toExecutiveSelection) &&
                        toExecutiveSelection !== 'all' &&
                        toExecutiveSelection !== 'Other' &&
                        toExecutiveSelection && (
                          <SelectItem value={toExecutiveSelection}>
                            {toExecutiveSelection}
                          </SelectItem>
                        )}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {toExecutiveSelection === 'Other' && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Specify other executive"
                        value={otherToExecutiveInput}
                        onChange={(e) =>
                          setOtherToExecutiveInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSetOtherToExecutive();
                        }}
                        disabled={isReadOnly}
                      />
                      <Button
                        size="sm"
                        onClick={handleSetOtherToExecutive}
                        disabled={isReadOnly}
                      >
                        OK
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveLead} disabled={isReadOnly}>
            SAVE
          </Button>
          <Button variant="outline" onClick={resetForm} disabled={isReadOnly}>
            RESET
          </Button>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Or upload leads from a file
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div
            className={cn(
              'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors',
              isDragging && !isReadOnly
                ? 'border-primary bg-primary/10'
                : 'border-input',
              isReadOnly && 'bg-muted/50 cursor-not-allowed'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">Drag & Drop Excel/CSV file</p>
            <p className="text-sm text-muted-foreground mt-1">or</p>
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="outline"
                onClick={handleBrowseFileClick}
                disabled={isReadOnly}
              >
                Browse File
              </Button>
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
            disabled={isReadOnly}
          />
          {parsedLeads.length > 0 && (
            <div className="mt-6 flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Preview data'}
              </Button>
              <Button onClick={handleConfirmUpload}>Confirm Upload</Button>
              <Button variant="destructive" onClick={handleCancelUpload}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && parsedLeads.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>
              Review the leads to be uploaded from the file. A total of{' '}
              {parsedLeads.length} leads will be added.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Executive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLeads.map((lead, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>{lead.contactPerson}</TableCell>
                      <TableCell>{String(lead.contactNumber)}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.executive}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    