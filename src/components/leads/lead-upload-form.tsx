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
import { useState } from 'react';
import { pincodeData } from '@/lib/pincodes';

export default function LeadUploadForm() {
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

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
          <Input id="company-headcount" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modules">Modules</Label>
          <Select>
            <SelectTrigger id="modules">
              <SelectValue placeholder="Select Modules..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="module1">Module 1</SelectItem>
              <SelectItem value="module2">Module 2</SelectItem>
              <SelectItem value="module3">Module 3</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            [ Auto selected modules based on the company size selection ]
          </p>
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
                    <p className="font-semibold">Drag & Drop Excel/CSV file</p>
                    <p className="text-sm text-muted-foreground">or</p>
                    <Button variant="outline" size="sm">Browse File</Button>
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-start gap-2">
          <Button variant="secondary">Preview data</Button>
          <Button>Confirm Upload</Button>
          <Button variant="destructive">Cancel</Button>
        </div>
      </div>

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
