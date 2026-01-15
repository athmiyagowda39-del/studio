
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

/* ---------------- TYPES ---------------- */

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

/* ---------------- CONSTANTS ---------------- */

const sectors = [
  'All','IT','Finance','Healthcare','Manufacturing','Education','Retail',
  'Hospitality','Telecommunication','Construction','Real Estate',
  'Media & Entertainment','Government','Non-profit','Other'
];

const references = [
  'All','Website','Social Media','Google Ads','Facebook Ads','LinkedIn',
  'Referral','Cold Call','Email Campaign','WhatsApp Campaign','Walk-in',
  'Telecalling','Events / Trade Shows','Webinars','Channel Partner',
  'Reseller','Distributor','Existing Customer','Upselling','Cross-selling',
  'Marketplace (Justdial / IndiaMART)','Third-party Data','Outdoor Marketing',
  'Newspaper Ads','TV / Radio Ads','Direct Sales','Field Sales','Franchise',
  'Customer Support','Demo Request','Trial Signup','Job Portal'
];

const initialFormState = {
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

/* ---------------- LOCAL STORAGE HELPERS ---------------- */

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  const data = localStorage.getItem('allLeads');
  return data ? JSON.parse(data) : [];
};

const saveLeadsToLocalStorage = (leads: LeadFormData[]) => {
  localStorage.setItem('allLeads', JSON.stringify(leads));
};

const getUsersFromLocalStorage = (): AppUser[] => {
  const data = localStorage.getItem('appUsers');
  return data ? JSON.parse(data) : [];
};

const getNextLeadId = (): string => {
  const leads = getLeadsFromLocalStorage();
  if (!leads.length) return '100000';
  return (Math.max(...leads.map(l => Number(l.leadId))) + 1).toString();
};

/* ---------------- COMPONENT ---------------- */

export default function LeadUploadForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [toExecutiveSelection, setToExecutiveSelection] = useState('');
  const [executiveNames, setExecutiveNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const users = getUsersFromLocalStorage();
    setExecutiveNames(users.filter(u => u.role === 'Executive').map(u => u.username));
  }, []);

  const handleInputChange = (e: any) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveLead = () => {
    if (!formData.reference) {
      toast({ variant: 'destructive', title: 'Reference required' });
      return;
    }

    const newLead: LeadFormData = {
      ...formData,
      leadId: getNextLeadId(),
      creationDate: Date.now(),
      status: 'Not viewed',
      dealer: formData.toExecutive ? toExecutiveSelection : 'As per mapping',
      givenBy: 'Manual',
    };

    const leads = [...getLeadsFromLocalStorage(), newLead];
    saveLeadsToLocalStorage(leads);

    toast({ title: 'Lead saved successfully' });
    setFormData(initialFormState);
    setToExecutiveSelection('');
  };

  return (
    <div className="space-y-6">
      <p className="font-semibold text-primary">Provide the new Lead detail</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <Label>Company</Label>
          <Input id="company" value={formData.company} onChange={handleInputChange} />
        </div>

        <div>
          <Label>Contact Person</Label>
          <Input id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
        </div>

        {/* ✅ REFERENCE DROPDOWN */}
        <div>
          <Label>Reference</Label>
          <Select
            value={formData.reference}
            onValueChange={(v) => handleSelectChange('reference', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Reference" />
            </SelectTrigger>
            <SelectContent>
              {references.map(ref => (
                <SelectItem key={ref} value={ref}>{ref}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label>Initial Remarks</Label>
          <Textarea
            id="initialRemarks"
            value={formData.initialRemarks}
            onChange={handleInputChange}
          />
        </div>

      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={formData.toExecutive}
          onCheckedChange={(c) => setFormData(p => ({ ...p, toExecutive: !!c }))}
        />
        <Label>To Executive</Label>
      </div>

      {formData.toExecutive && (
        <Select value={toExecutiveSelection} onValueChange={setToExecutiveSelection}>
          <SelectTrigger>
            <SelectValue placeholder="Select Executive" />
          </SelectTrigger>
          <SelectContent>
            {executiveNames.map(e => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSaveLead}>SAVE</Button>
        <Button variant="outline" onClick={() => setFormData(initialFormState)}>RESET</Button>
      </div>
    </div>
  );
}
