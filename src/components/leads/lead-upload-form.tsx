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
import { Download, UploadCloud } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { useState, useRef } from 'react';
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

type ParsedData = (string | number)[][];

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
  selectedModule: string;
  toDealer: boolean;
};

const initialFormState: Omit<LeadFormData, 'leadId'> = {
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
    selectedModule: '',
    toDealer: false,
};


export default function LeadUploadForm() {
  const [formData, setFormData] = useState<Omit<LeadFormData, 'leadId'>>(initialFormState);
  const [addedLeads, setAddedLeads] = useState<LeadFormData[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

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
    const newFormData = { ...formData, headcount: newHeadcount };

    const count = parseInt(newHeadcount, 10);
    if (!isNaN(count)) {
      if (count >= 100 && count < 200) {
        newFormData.selectedModule = 'ar';
      } else if (count >= 200) {
        newFormData.selectedModule = 'all-hrms';
      } else {
        newFormData.selectedModule = '';
      }
    } else {
      newFormData.selectedModule = '';
    }
    setFormData(newFormData);
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({...prev, selectedModule: value}));
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({...prev, toDealer: checked as boolean}));
  }

  const resetForm = () => {
    setFormData(initialFormState);
    setAddedLeads([]);
  };

  const validateLead = (lead: Omit<LeadFormData, 'leadId'>) => {
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
    } catch (error) {
      console.error("Could not save leads to localStorage", error);
      toast({
        variant: "destructive",
        title: "Storage Error",
        description: "Could not save leads. Your browser might be in private mode or has storage disabled.",
      });
    }
  }

  const handleSaveLeads = () => {
    let leadsToSave = [...addedLeads];
    
    const formHasData = formData.pincode || formData.contactPerson || formData.company || formData.address || formData.contactNumber;

    if (formHasData) {
       if (!validateLead(formData)) return;
        const newLeadId = `LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        leadsToSave.push({ ...formData, leadId: newLeadId });
    }

    if (leadsToSave.length === 0) {
         toast({
            variant: "destructive",
            title: "No leads to save",
            description: "Please add or enter at least one valid lead before saving.",
        });
        return;
    }

    saveLeadsToLocalStorage(leadsToSave);
    
    toast({
        title: "Leads added successfully",
        description: `${leadsToSave.length} lead(s) have been successfully saved.`,
    });
    resetForm();
  };

  const handleBrowseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
        const headers = (json[0] as string[]).map(h => h.trim());
        const leads: LeadFormData[] = json.slice(1).map((row: any[], rowIndex) => {
            const lead: any = {};
            headers.forEach((header, index) => {
                lead[header] = row[index];
            });

            const location = pincodeData[lead.pincode];
            
            const headcount = lead.headcount?.toString() || '';
            let selectedModule = '';
            const count = parseInt(headcount, 10);
            if (!isNaN(count)) {
              if (count >= 100 && count < 200) {
                selectedModule = 'ar';
              } else if (count >= 200) {
                selectedModule = 'all-hrms';
              }
            }


            return {
                leadId: `LEAD-${Date.now()}-${rowIndex}-${Math.floor(Math.random() * 1000)}`,
                pincode: lead.pincode || '',
                state: location?.state || '',
                district: location?.district || '',
                address: lead.address || '',
                contactPerson: lead.contactPerson || '',
                contactNumber: lead.contactNumber || '',
                reference: lead.reference || '',
                email: lead.email || '',
                company: lead.company || '',
                headcount: headcount,
                selectedModule: selectedModule,
                toDealer: false,
            };
        });

        saveLeadsToLocalStorage(leads);
        
        toast({
            title: "Upload Confirmed",
            description: `${leads.length} lead(s) have been successfully queued for import.`,
        });
        handleCancel();
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
      ['pincode', 'address', 'contactPerson', 'contactNumber', 'reference', 'email', 'company', 'headcount'],
      ['560001', '123 MG Road, Bengaluru', 'John Doe', '9876543210', 'Friend', 'john.doe@example.com', 'Tech Solutions', '150'],
      ['560002', '456 Brigade Road, Bengaluru', 'Jane Smith', '8765432109', 'Website', 'jane.smith@example.com', 'Innovate Corp', '250'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'sample_leads.xlsx');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold">Provide the new Lead detail</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pincode">Pin code <span className="text-destructive">*</span></Label>
            <Input id="pincode" value={formData.pincode} onChange={handlePincodeChange} required/>
          </div>
          <div></div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={formData.state} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input id="district" value={formData.district} readOnly />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
            <Input id="address" value={formData.address} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person <span className="text-destructive">*</span></Label>
            <Input id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number <span className="text-destructive">*</span></Label>
            <Input id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" value={formData.reference} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={formData.company} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headcount">Company headcount</Label>
            <Input id="headcount" value={formData.headcount} onChange={handleHeadcountChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modules">Modules</Label>
            <Select value={formData.selectedModule} onValueChange={handleSelectChange}>
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
        <Button onClick={handleSaveLeads}>Save Lead</Button>
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
    </div>
  );
}

    
