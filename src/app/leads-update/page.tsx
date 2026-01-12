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
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import LeadUpdateForm from '@/components/leads/lead-update-form';
import AppContent from '../app-content';
import * as XLSX from 'xlsx';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ---------------- CONSTANTS ---------------- */

const LEADS_PER_PAGE = 10;

const initialFilterState = {
  search: '',
  fromSource: 'both',
  searchFor: 'company',
  fromDate: undefined as Date | undefined,
  toDate: undefined as Date | undefined,
  productName: 'all',
  executiveName: 'all',
  givenBy: 'all',
  statusOfLead: 'all',
  subStatusOfLead: 'all',
  leadSource: 'all',
  pincode: '',
  email: '',
  headcount: '',
  sector: 'all',
  doNotConsider: true,
  considerFollowUps: false,
  followUpStatus: 'pending',
  followUpFromDate: undefined as Date | undefined,
  followUpToDate: undefined as Date | undefined,
  enterBy: 'all',
  remarksFilter: '',
};

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
  const [filters, setFilters] = useState(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  const [showResults, setShowResults] = useState(true);
  const [activeQuickFilter, setActiveQuickFilter] = useState('All Leads');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { toast } = useToast();

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    const leads = getLeadsFromLocalStorage();
    setAllLeads(leads);
    setFilteredLeads(leads);
  }, []);

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

        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              UPDATE LEADS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            <LeadUpdateForm
              leadId={selectedLeadId}
              allLeads={allLeads}
            />

            {showResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    List of Leads &gt;&gt; [{activeQuickFilter} ({filteredLeads.length} Records)]
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="max-h-[450px] overflow-auto">
                      <Table className="min-w-[1800px]">
                        <TableHeader className="sticky top-0 bg-background z-10">
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
                            <TableRow
                              key={lead.leadId}
                              onClick={() => setSelectedLeadId(lead.leadId)}
                              className="cursor-pointer"
                            >
                              <TableCell>{(currentPage - 1) * LEADS_PER_PAGE + index + 1}</TableCell>
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
                  </ScrollArea>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-end gap-2 p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className='self-center text-sm'>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
