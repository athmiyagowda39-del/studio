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
} from '@/components/ui/card';
import { useState, useRef, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getDisplayModule } from '@/lib/modules';

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
  creationDate: string;
  executiveViewDate?: string;
  followUps?: FollowUp[];
  nextFollowUpDate?: string;
  dealer?: string;
  manager?: string;
  executive?: string;
  givenBy?: string;
  status?: string;
  leadSubStatus?: string;
  initialRemarks?: string;
  monthlyContractValue?: string;
  annualContractValue?: string;
};

const initialFormState: Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy' | 'executiveViewDate'> = {
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
  monthlyContractValue: '',
  annualContractValue: '',
};

export default function LeadUploadForm() {
  const { user, users, isReadOnly, isImpersonating, addLeads, getNextLeadId, leads: allLeads, sectors, leadReferences, modules } = useApp();
  const [formData, setFormData] = useState<
    Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy' | 'executiveViewDate'>
  >(initialFormState);
  const [parsedLeads, setParsedLeads] = useState<Partial<LeadFormData>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [toExecutiveSelection, setToExecutiveSelection] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [executives, setExecutives] = useState<string[]>([]);
  const [companyError, setCompanyError] = useState('');
  
  // States for "Other" inputs
  const [showOtherSector, setShowOtherSector] = useState(false);
  const [otherSectorInput, setOtherSectorInput] = useState('');
  const [showOtherReference, setShowOtherReference] = useState(false);
  const [otherReferenceInput, setOtherReferenceInput] = useState('');

  const isExecutiveContext = user?.role === 'Executive';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const managers = users.filter(u => u.role === 'Manager');

  const hrModules = useMemo(() => modules.filter(m => m.category === 'HR').map(m => m.name), [modules]);
  const financeModules = useMemo(() => modules.filter(m => m.category === 'Finance').map(m => m.name), [modules]);
  const generalModules = useMemo(() => modules.filter(m => m.category === 'General').map(m => m.name), [modules]);
  const allModulesNames = useMemo(() => modules.map(m => m.name), [modules]);

  useEffect(() => {
    const executiveUsers = users
      .filter((user) => user.role === 'Executive')
      .map((user) => user.username);
    setExecutives(executiveUsers);
  }, [users]);

  useEffect(() => {
    const validUser = user as { role?: string; username: string };
    if (
      validUser?.role === 'Executive' ||
      (isImpersonating && validUser?.role === 'Executive')
    ) {
      setFormData((prev) => ({ ...prev, toExecutive: true }));
      setToExecutiveSelection(validUser.username);
    } else {
      setFormData((prev) => ({ ...prev, toExecutive: false }));
      setToExecutiveSelection('');
    }
  }, [user, isImpersonating]);

  useEffect(() => {
    if (formData.pincode.length === 6) {
      if (formData.pincode === '122098') {
        setFormData((prev) => ({
          ...prev,
          state: 'Haryana',
          district: 'Gurugram',
        }));
        toast({
          title: 'Location Found',
          description: `State and District have been auto-filled for pincode ${formData.pincode}.`,
        });
        return;
      }

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
  
  useEffect(() => {
    if (!formData.company) {
      setCompanyError('');
      return;
    }

    const handler = setTimeout(() => {
      const duplicateLead = allLeads.find(
        (lead) => lead.company && lead.company.trim().toLowerCase() === formData.company.trim().toLowerCase()
      );
      if (duplicateLead) {
        setCompanyError(`A lead with this company name already exists. Lead ID: ${duplicateLead.leadId}`);
      } else {
        setCompanyError('');
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [formData.company, allLeads]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id === 'contactNumber') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, [id]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id: string, value: string) => {
    if (value === 'Other') {
      if (id === 'sector') setShowOtherSector(true);
      if (id === 'reference') setShowOtherReference(true);
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCommitOtherSector = () => {
    if (otherSectorInput.trim()) {
      setFormData(prev => ({ ...prev, sector: otherSectorInput.trim() }));
      setOtherSectorInput('');
      setShowOtherSector(false);
    }
  };

  const handleCommitOtherReference = () => {
    if (otherReferenceInput.trim()) {
      setFormData(prev => ({ ...prev, reference: otherReferenceInput.trim() }));
      setOtherReferenceInput('');
      setShowOtherReference(false);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, toExecutive: checked as boolean }));
    if (!checked) {
      setToExecutiveSelection('');
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setCompanyError('');
    handleCancelUpload();
    setShowOtherSector(false);
    setShowOtherReference(false);
    setOtherSectorInput('');
    setOtherReferenceInput('');
    
    const validUser = user as { role?: string; username: string };
    if (validUser?.role === 'Executive' || (isImpersonating && validUser?.role === 'Executive')) {
        setFormData(prev => ({...prev, toExecutive: true}));
        setToExecutiveSelection(validUser.username);
    } else {
        setToExecutiveSelection('');
    }
  };

  const validateLead = (
    lead: Omit<LeadFormData, 'leadId' | 'creationDate' | 'givenBy' | 'executiveViewDate'>
  ) => {
    const requiredFields: (keyof typeof lead)[] = [
      'pincode', 'company', 'contactPerson', 'address', 'state', 'district', 'contactNumber', 
      'email', 'reference', 'headcount', 'sector', 'selectedModule', 'manager', 'initialRemarks'
    ];

    for (const field of requiredFields) {
      if (!lead[field as keyof typeof lead]) {
        toast({
          variant: 'destructive',
          title: 'Missing Information',
          description: `Please fill in all required fields.`,
        });
        return false;
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return false;
    }

    if (formData.toExecutive && (!toExecutiveSelection || toExecutiveSelection === 'all')) {
      toast({
        variant: 'destructive',
        title: 'Executive Not Assigned',
        description: 'Please assign an executive.',
      });
      return false;
    }

    return true;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveLead = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!validateLead(formData)) {
        setIsSaving(false);
        return;
      }

      if (companyError) {
        toast({
          variant: 'destructive',
          title: 'Duplicate Company',
          description: companyError
        });
        setIsSaving(false);
        return;
      }

      const isDuplicate = allLeads.some(
        lead =>
          (lead.contactNumber &&
            formData.contactNumber &&
            lead.contactNumber.trim() === formData.contactNumber.trim()) ||
          (lead.email &&
            formData.email &&
            lead.email.trim().toLowerCase() === formData.email.trim().toLowerCase())
      );

      if (isDuplicate) {
        toast({
          variant: 'destructive',
          title: 'Duplicate Lead',
          description: 'A lead with this contact number or email already exists.'
        });
        setIsSaving(false);
        return;
      }

      const newLeadId = await getNextLeadId();

      const newLead: LeadFormData = {
        ...formData,
        givenBy: user?.username || 'Manual',
        leadId: newLeadId,
        creationDate: new Date().toISOString(),
        status: 'Not viewed',
        executive: formData.toExecutive ? toExecutiveSelection : undefined,
      };

      await addLeads([newLead]);
      toast({ title: 'Lead saved successfully' });
      resetForm();

    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const processFileAndUpload = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a valid Excel or CSV file.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: ParsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          toast({ variant: 'destructive', title: 'Empty File', description: 'The file has no data rows.' });
          return;
        }

        const headers: string[] = (json[0] as string[]).map((h) => String(h).toLowerCase().replace(/\s+/g, ''));
        const keyMap: { [key: string]: keyof Partial<LeadFormData> } = {
          pincode: 'pincode', company: 'company', contactperson: 'contactPerson', address: 'address',
          state: 'state', district: 'district', contactnumber: 'contactNumber', email: 'email',
          reference: 'reference', headcount: 'headcount', sector: 'sector', selectedmodule: 'selectedModule',
          manager: 'manager', executive: 'executive', monthlycontractvalue: 'monthlyContractValue', annualcontractvalue: 'annualContractValue',
        };

        const leadsData = json.slice(1).map((row) => {
          const leadObject: Partial<LeadFormData> = {};
          if (Array.isArray(row)) {
            headers.forEach((header, index) => {
              const formKey = keyMap[header];
              if (formKey) {
                const value = row[index];
                (leadObject as any)[formKey] = value !== null && value !== undefined ? String(value) : '';
              }
            });
          }
          return leadObject;
        }).filter((lead) => Object.values(lead).some(val => val !== ''));

        if (leadsData.length === 0) {
          toast({ variant: 'destructive', title: 'No Data Found' });
          return;
        }
        
        setParsedLeads(leadsData);
        setShowPreview(false);
        toast({ title: `File Processed: ${leadsData.length} leads found.` });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error parsing file' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmUpload = async () => {
    if (parsedLeads.length === 0) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < parsedLeads.length; i++) {
      const lead = parsedLeads[i];
      if (lead.email && !emailRegex.test(lead.email)) {
        toast({
          variant: 'destructive',
          title: `Invalid Email`,
          description: `Row ${i + 2} has an invalid email.`,
        });
        return;
      }
    }

    let nextId = parseInt(await getNextLeadId(), 10);
    const newLeads: LeadFormData[] = parsedLeads.map((parsedLead) => ({
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
      leadId: (nextId++).toString(),
      creationDate: new Date().toISOString(),
      givenBy: user?.username || 'File Upload',
      status: 'Not viewed',
      monthlyContractValue: parsedLead.monthlyContractValue || '',
      annualContractValue: parsedLead.annualContractValue || '',
    }));

    await addLeads(newLeads);
    toast({ title: 'Upload Successful', description: `${newLeads.length} leads saved.` });
    handleCancelUpload();
  };

  const handleCancelUpload = () => {
    setParsedLeads([]);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSample = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leads');

      const headers = [
        'company', 'contactPerson', 'address', 'state', 'district', 'contactNumber', 'email', 'pincode', 'reference', 'headcount', 'sector', 'selectedModule', 'manager', 'executive'
      ];
      worksheet.addRow(headers);

      // Dynamically pick options from database tables/users
      const sectorOptions = sectors.length > 0 ? [...sectors] : [
        'Construction', 'Education', 'Finance', 'Government', 'Healthcare', 'Hospitality', 'IT', 'Manufacturing',
        'Media & Entertainment', 'Non-profit', 'Other', 'Pharmaceutical', 'Real Estate', 'Retail', 'Telecommunication'
      ];
      if (!sectorOptions.includes('Other')) sectorOptions.push('Other');

      const referenceOptions = leadReferences.length > 0 ? [...leadReferences] : [
        'Channel Partner', 'Cold Call', 'Cross-selling', 'Demo Request', 'Email Campaign', 'Events / Trade Shows',
        'Existing Customer', 'Facebook Ads', 'Google Ads', 'IndiaMART', 'LinkedIn', 'Other', 'Referral',
        'Social Media', 'Telecalling', 'Trial Signup', 'Upselling', 'Walk-in', 'Website', 'WhatsApp Campaign'
      ];
      if (!referenceOptions.includes('Other')) referenceOptions.push('Other');

      const managerOptions = users.filter(u => u.role === 'Manager').map(u => u.username);
      const executiveOptions = users.filter(u => u.role === 'Executive').map(u => u.username);

      const moduleOptions: string[] = ['All Modules'];
      if (hrModules.length > 0) {
        moduleOptions.push('--- HR MODULES ---', 'HR Module');
        hrModules.forEach(m => moduleOptions.push(`  ${m}`));
      }
      if (financeModules.length > 0) {
        moduleOptions.push('--- FINANCE MODULES ---', 'Finance Module');
        financeModules.forEach(m => moduleOptions.push(`  ${m}`));
      }
      if (generalModules.length > 0) {
        moduleOptions.push('--- GENERAL MODULES ---', 'General Module');
        generalModules.forEach(m => moduleOptions.push(`  ${m}`));
      }

      const listSheet = workbook.addWorksheet('Lists');
      listSheet.state = 'veryHidden';

      sectorOptions.forEach((v, i) => listSheet.getCell(`A${i + 1}`).value = v);
      referenceOptions.forEach((v, i) => listSheet.getCell(`B${i + 1}`).value = v);
      managerOptions.forEach((v, i) => listSheet.getCell(`C${i + 1}`).value = v);
      moduleOptions.forEach((v, i) => listSheet.getCell(`D${i + 1}`).value = v);
      executiveOptions.forEach((v, i) => listSheet.getCell(`E${i + 1}`).value = v);

      const sectorRange = `Lists!$A$1:$A$${sectorOptions.length}`;
      const referenceRange = `Lists!$B$1:$B$${referenceOptions.length}`;
      const managerRange = `Lists!$C$1:$C$${Math.max(managerOptions.length, 1)}`;
      const moduleRange = `Lists!$D$1:$D$${moduleOptions.length}`;
      const executiveRange = `Lists!$E$1:$E$${Math.max(executiveOptions.length, 1)}`;

      for (let i = 2; i <= 1001; i++) {
        // I: reference, K: sector, L: selectedModule, M: manager, N: executive
        worksheet.getCell(`I${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [referenceRange] };
        worksheet.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [sectorRange] };
        worksheet.getCell(`L${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [moduleRange] };
        worksheet.getCell(`M${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [managerRange] };
        worksheet.getCell(`N${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [executiveRange] };
      }

      const addNote = (cellRef: string, fieldName: string) => {
        const cell = worksheet.getCell(cellRef);
        cell.note = {
          texts: [
            { font: { bold: true, size: 10 }, text: `How to select ${fieldName}:\n` },
            { font: { size: 9 }, text: `1. Select an option from the dropdown.\n2. To select MULTIPLE values, type them manually separated by commas (e.g., Value1, Value2).` }
          ]
        };
      };

      addNote('I1', 'References');
      addNote('K1', 'Sectors');
      addNote('L1', 'Modules');

      worksheet.getRow(1).font = { bold: true };
      worksheet.columns.forEach(col => col.width = 22);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.body.appendChild(document.createElement('a'));
      a.href = url;
      a.download = 'LeadUploadSample.xlsx';
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast({ title: 'Sample Downloaded' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Download Failed' });
    }
  };

  const selectedModulesArray = formData.selectedModule ? formData.selectedModule.split(', ').filter(Boolean) : [];

  const handleModuleToggle = (moduleName: string) => {
    const newSelection = new Set(selectedModulesArray);
    newSelection.has(moduleName) ? newSelection.delete(moduleName) : newSelection.add(moduleName);
    handleSelectChange('selectedModule', Array.from(newSelection).join(', '));
  };

  const handleCategoryToggle = (categoryModules: string[], isAdding: boolean) => {
    const newSelection = new Set(selectedModulesArray);
    categoryModules.forEach(m => isAdding ? newSelection.add(m) : newSelection.delete(m));
    handleSelectChange('selectedModule', Array.from(newSelection).join(', '));
  };

  const getCategoryCheckedState = (categoryModules: string[]): boolean | 'indeterminate' => {
    const selectionCount = categoryModules.filter(m => selectedModulesArray.includes(m)).length;
    if (selectionCount === 0) return false;
    if (selectionCount === categoryModules.length) return true;
    return 'indeterminate';
  };

  const handleAllToggle = (isAdding: boolean) => {
    handleSelectChange('selectedModule', isAdding ? allModulesNames.join(', ') : '');
  };

  const getModuleButtonText = () => {
    if (!formData.selectedModule) return 'Select Module(s)...';
    const buttonText = getDisplayModule(formData.selectedModule, modules);
    return buttonText === 'N/A' ? 'Select Module(s)...' : buttonText;
  };

  const ModuleSelectItem = ({ moduleName }: { moduleName: string }) => (
    <div key={moduleName} className="flex items-center space-x-3 rounded-md p-2 pr-4 hover:bg-accent cursor-pointer" onClick={() => handleModuleToggle(moduleName)}>
        <Checkbox id={`mod-${moduleName}`} checked={selectedModulesArray.includes(moduleName)} readOnly tabIndex={-1} className="ml-1" />
        <label htmlFor={`mod-${moduleName}`} className="text-sm font-medium leading-none cursor-pointer w-full">{moduleName}</label>
    </div>
  );

  return (
    <div className="space-y-6">
      {isReadOnly && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Read-Only Mode</AlertTitle>
          <AlertDescription>No new leads can be created while impersonating a user.</AlertDescription>
        </Alert>
      )}
      <div>
        <p className="font-semibold mb-4 text-primary">Provide the new Lead detail</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pincode">Pin code</Label>
            <Input id="pincode" value={formData.pincode} onChange={handleInputChange} maxLength={6} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={formData.company} onChange={handleInputChange} readOnly={isReadOnly} />
            {companyError && <p className="text-sm text-destructive mt-1">{companyError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={handleInputChange} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={formData.state} onChange={(e) => handleSelectChange('state', e.target.value)} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input id="district" value={formData.district} onChange={(e) => handleSelectChange('district', e.target.value)} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" type="tel" value={formData.contactNumber} onChange={handleInputChange} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <div className="flex flex-col gap-2">
              <Select value={formData.reference} onValueChange={(value) => handleSelectChange('reference', value)} disabled={isReadOnly}>
                <SelectTrigger id="reference">
                  {formData.reference && !leadReferences.includes(formData.reference) ? (<span className="truncate">{formData.reference}</span>) : (<SelectValue placeholder="Select Reference..." />)}
                </SelectTrigger>
                <SelectContent>
                  {leadReferences.map((ref) => (<SelectItem key={ref} value={ref}>{ref}</SelectItem>))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {showOtherReference && (
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    placeholder="Enter other reference..." 
                    value={otherReferenceInput} 
                    onChange={(e) => setOtherReferenceInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCommitOtherReference(); }}
                  />
                  <Button size="sm" onClick={handleCommitOtherReference}>OK</Button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headcount">Company headcount</Label>
            <Input id="headcount" value={formData.headcount} onChange={handleInputChange} readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <div className="flex flex-col gap-2">
              <Select value={formData.sector} onValueChange={(value) => handleSelectChange('sector', value)} disabled={isReadOnly}>
                <SelectTrigger id="sector">
                  {formData.sector && !sectors.includes(formData.sector) ? (<span className="truncate">{formData.sector}</span>) : (<SelectValue placeholder="Select Sector..." />)}
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (<SelectItem key={sector} value={sector}>{sector}</SelectItem>))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {showOtherSector && (
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    placeholder="Enter other sector..." 
                    value={otherSectorInput} 
                    onChange={(e) => setOtherSectorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCommitOtherSector(); }}
                  />
                  <Button size="sm" onClick={handleCommitOtherSector}>OK</Button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="selectedModule">Module</Label>
            <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen} modal={false}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal" disabled={isReadOnly}>
                  <span className="truncate">{getModuleButtonText()}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <div className="p-2 font-bold text-center border-b">Modules</div>
                <ScrollArea className="h-72">
                  <div className="space-y-1 p-1">
                    <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold">
                      <Checkbox id="all-modules" onCheckedChange={(checked) => handleAllToggle(!!checked)} className="ml-1" />
                      <label htmlFor="all-modules" className="w-full cursor-pointer">All Modules</label>
                    </div>
                    {hrModules.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold cursor-pointer">
                              <Checkbox id="hr-cat" checked={getCategoryCheckedState(hrModules)} onCheckedChange={(checked) => handleCategoryToggle(hrModules, !!checked)} className="ml-1" />
                              <span className="flex w-full items-center justify-between">HR Modules <ChevronDown className="h-4 w-4" /></span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6">{hrModules.map(m => <ModuleSelectItem key={m} moduleName={m} />)}</CollapsibleContent>
                      </Collapsible>
                    )}
                    {financeModules.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold cursor-pointer">
                              <Checkbox id="finance-cat" checked={getCategoryCheckedState(financeModules)} onCheckedChange={(checked) => handleCategoryToggle(financeModules, !!checked)} className="ml-1" />
                              <span className="flex w-full items-center justify-between">Finance Modules <ChevronDown className="h-4 w-4" /></span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6">{financeModules.map(m => <ModuleSelectItem key={m} moduleName={m} />)}</CollapsibleContent>
                      </Collapsible>
                    )}
                    {generalModules.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center space-x-3 rounded-md p-2 pr-4 font-semibold cursor-pointer">
                              <Checkbox id="general-cat" checked={getCategoryCheckedState(generalModules)} onCheckedChange={(checked) => handleCategoryToggle(generalModules, !!checked)} className="ml-1" />
                              <span className="flex w-full items-center justify-between">General Modules <ChevronDown className="h-4 w-4" /></span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6">{generalModules.map(m => <ModuleSelectItem key={m} moduleName={m} />)}</CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select value={formData.manager || ''} onValueChange={(v) => handleSelectChange('manager', v)} disabled={isReadOnly}>
              <SelectTrigger id="manager"><SelectValue placeholder="Select Manager..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {managers.map(m => <SelectItem key={m.id} value={m.username}>{m.username}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="initialRemarks">Initial Remarks</Label>
            <Textarea id="initialRemarks" value={formData.initialRemarks || ''} onChange={handleInputChange} readOnly={isReadOnly} />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t">
        <div className="flex items-center gap-4">
          <Checkbox id="toEx" checked={formData.toExecutive} onCheckedChange={handleCheckboxChange} disabled={isExecutiveContext || isImpersonating || isReadOnly} />
          <Label htmlFor="toEx">To Executive</Label>
          {formData.toExecutive && (
            <Select value={toExecutiveSelection} onValueChange={setToExecutiveSelection} disabled={isReadOnly}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Assign Executive..." /></SelectTrigger>
              <SelectContent>{executives.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
        <div className="flex gap-2">
         <Button onClick={handleSaveLead} disabled={isReadOnly || isSaving}>
          {isSaving ? 'Saving...' : 'SAVE'}
        </Button>
          <Button variant="outline" onClick={resetForm} disabled={isReadOnly}>RESET</Button>
        </div>
      </div>
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (!isReadOnly && e.dataTransfer.files[0]) processFileAndUpload(e.dataTransfer.files[0]); }}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">Drag & Drop Excel/CSV file</p>
            <div className="flex items-center gap-4 mt-4">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isReadOnly}>Browse File</Button>
              <Button variant="ghost" onClick={handleDownloadSample}><Download className="mr-2 h-4 w-4" />Download Sample</Button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && processFileAndUpload(e.target.files[0])} accept=".xlsx, .xls, .csv" disabled={isReadOnly} />
          {parsedLeads.length > 0 && (
            <div className="mt-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </Button>
                <Button onClick={handleConfirmUpload}>Confirm Upload</Button>
                <Button variant="destructive" onClick={handleCancelUpload}>Cancel</Button>
              </div>

              {showPreview && (
                <div className="border rounded-md overflow-hidden bg-background">
                  <div className="p-3 bg-muted/50 border-b font-semibold text-sm">
                    File Data Preview ({parsedLeads.length} leads)
                  </div>
                  <ScrollArea className="h-[400px] w-full">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Pincode</TableHead>
                          <TableHead>District</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>Manager</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedLeads.map((lead, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{idx + 1}</TableCell>
                            <TableCell>{lead.company || 'N/A'}</TableCell>
                            <TableCell>{lead.contactPerson || 'N/A'}</TableCell>
                            <TableCell>{lead.contactNumber || 'N/A'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{lead.email || 'N/A'}</TableCell>
                            <TableCell>{lead.pincode || 'N/A'}</TableCell>
                            <TableCell>{lead.district || 'N/A'}</TableCell>
                            <TableCell>{lead.state || 'N/A'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{lead.selectedModule || 'N/A'}</TableCell>
                            <TableCell>{lead.manager || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
