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
import { UploadCloud } from 'lucide-react';
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

export default function LeadUploadForm() {
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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

  const handleHeadcountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeadcount = e.target.value;
    setHeadcount(newHeadcount);

    const count = parseInt(newHeadcount, 10);
    if (!isNaN(count)) {
      if (count >= 100 && count < 200) {
        setSelectedModule('ar');
      } else if (count >= 200) {
        setSelectedModule('all-hrms');
      } else {
        setSelectedModule('');
      }
    } else {
      setSelectedModule('');
    }
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

  const handlePreviewData = () => {
    if (!selectedFile) {
        toast({
            variant: "destructive",
            title: "No file selected",
            description: "Please select a file to preview.",
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
        setParsedData(json);
        setShowPreview(true);
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Error parsing file",
            description: "Could not read the file. Please ensure it's a valid Excel/CSV file.",
        });
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleConfirmUpload = () => {
    if (!parsedData) {
        toast({
            variant: "destructive",
            title: "No data to upload",
            description: "Please preview data before confirming.",
        });
      return;
    }
    // Here you would typically send the data to your backend
    toast({
        title: "Upload Confirmed",
        description: "Your lead data has been successfully queued for import.",
    });
    handleCancel();
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
      <p className="font-semibold">Provide the new Lead detail</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pincode">Pin code</Label>
          <Input id="pincode" value={pincode} onChange={handlePincodeChange} />
        </div>
        <div></div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" placeholder="Auto fill based on pin code" value={state} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Input id="district" placeholder="Auto fill based on pin code" value={district} readOnly />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-person">Contact person</Label>
          <Input id="contact-person" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-number">Contact Number</Label>
          <Input id="contact-number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-id">Lead ID</Label>
          <Input id="lead-id" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference">Reference</Label>
          <Input id="reference" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" />
        </div>
        <div></div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-headcount">Company headcount</Label>
          <Input id="company-headcount" value={headcount} onChange={handleHeadcountChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modules">Modules</Label>
          <Select value={selectedModule} onValueChange={setSelectedModule}>
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
            <Checkbox id="to-dealer" />
            <Label htmlFor="to-dealer">To Dealer</Label>
            <span className="text-xs text-muted-foreground">As per Mapping</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">New</Button>
            <Button>Add Lead &gt;&gt;</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="border-dashed">
            <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <p className="font-semibold">{selectedFile ? selectedFile.name : "Drag & Drop Excel/CSV file"}</p>
                    <p className="text-sm text-muted-foreground">or</p>
                    <Button variant="outline" size="sm" onClick={handleBrowseFileClick}>Browse File</Button>
                    <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-start gap-2">
          <Button variant="secondary" onClick={handlePreviewData}>Preview data</Button>
          <Button onClick={handleConfirmUpload}>Confirm Upload</Button>
          <Button variant="destructive" onClick={handleCancel}>Cancel</Button>
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


      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
            <Button variant="outline">Reset</Button>
            <Button>Save Lead</Button>
        </div>
        <p className="text-sm text-muted-foreground">Note: ALL MODULES IN HRMS</p>
      </div>
    </div>
  );
}
