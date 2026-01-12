'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import LeadUpdateForm from '@/components/leads/lead-update-form';
import AppContent from '../app-content';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/* ---------------- CONSTANTS ---------------- */

const LEADS_PER_PAGE = 10;

/* ---------------- HELPERS ---------------- */

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('allLeads');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

/* ---------------- COMPONENT ---------------- */

export default function LeadsUpdatePage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadFormData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // ✅ FILTER TOGGLE
  const [showFilters, setShowFilters] = useState(false);

  /* ---------------- EFFECT ---------------- */

  useEffect(() => {
    const leads = getLeadsFromLocalStorage();
    setAllLeads(leads);
    setFilteredLeads(leads);
  }, []);

  const handleLeadsUpdate = (updatedLeads: LeadFormData[]) => {
    setAllLeads(updatedLeads);
    setFilteredLeads(updatedLeads);
  };

  /* ---------------- PAGINATION ---------------- */

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(start, start + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  /* ---------------- UI ---------------- */

  return (
    <AppContent>
      <div className="flex flex-col gap-6">

        {/* PAGE CARD */}
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              UPDATE LEADS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            {/* LEAD STATUS */}
            <LeadUpdateForm
              leadId={selectedLeadId}
              allLeads={allLeads}
              setAllLeads={handleLeadsUpdate}
            />

            {/* ================= FILTER TOGGLE ================= */}
            <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-md">
              <span className="font-medium">
                Filter [{showFilters ? 'hide' : 'show'}]
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(prev => !prev)}
              >
                {showFilters ? '▲' : '▼'}
              </Button>
            </div>

            {/* ================= FILTER PANEL ================= */}
            {showFilters && (
              <Card>
                <CardContent className="p-4 space-y-4">

                  {/* ROW 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input placeholder="Search (leave empty for all)" />

                    <RadioGroup defaultValue="both" className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="web" /> Web Downloads
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="manual" /> Manual Uploads
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="both" /> Both
                      </div>
                    </RadioGroup>
                  </div>

                  {/* ROW 2 */}
                  <RadioGroup defaultValue="company" className="flex flex-wrap gap-4">
                    {['Lead ID', 'Company', 'Contact Person', 'Phone', 'District', 'State', 'Email', 'Manager Name'].map(v => (
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem value={v} /> {v}
                      </div>
                    ))}
                  </RadioGroup>

                  {/* ROW 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input type="date" />
                    <Input type="date" />
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Product Name" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Executive Name" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ROW 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select><SelectTrigger><SelectValue placeholder="Given By" /></SelectTrigger></Select>
                    <Select><SelectTrigger><SelectValue placeholder="Status of Lead" /></SelectTrigger></Select>
                    <Select><SelectTrigger><SelectValue placeholder="Sub Status of Lead" /></SelectTrigger></Select>
                    <Select><SelectTrigger><SelectValue placeholder="Lead Source" /></SelectTrigger></Select>
                  </div>

                  {/* ROW 5 */}
                  <div className="flex items-center gap-2">
                    <Checkbox /> Do not consider Order Closed/Fake/Existing Users/Not Interested
                  </div>

                  {/* ROW 6 */}
                  <RadioGroup defaultValue="pending" className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="pending" /> Follow Up Pending
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="made" /> Follow Up Made
                    </div>
                  </RadioGroup>

                  {/* ROW 7 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input type="date" />
                    <Input type="date" />
                    <Select><SelectTrigger><SelectValue placeholder="Entered By" /></SelectTrigger></Select>
                    <Input placeholder="Remarks" />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-end gap-3">
                    <Button>SHOW</Button>
                    <Button variant="secondary">TO EXCEL</Button>
                    <Button variant="destructive">RESET</Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* ================= TABLE ================= */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  List of Leads &gt;&gt; [All Leads ({filteredLeads.length} Records)]
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="w-full overflow-x-auto border rounded-md">
                  <Table className="min-w-[1800px]">
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Lead Id</TableHead>
                        <TableHead>Lead Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedLeads.map((lead, index) => (
                        <TableRow key={lead.leadId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{lead.leadId}</TableCell>
                          <TableCell>{format(new Date(lead.creationDate), 'PPP')}</TableCell>
                          <TableCell>{lead.selectedModule}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.contactPerson}</TableCell>
                          <TableCell>{lead.contactNumber}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.address}</TableCell>
                          <TableCell>{lead.district}</TableCell>
                          <TableCell>{lead.state}</TableCell>
                          <TableCell>{lead.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
