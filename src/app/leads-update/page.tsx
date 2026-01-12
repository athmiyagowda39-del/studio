
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

  /* ---------------- EFFECT ---------------- */

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
      <div className="flex flex-col gap-6 max-w-full">

        {/* PAGE CARD */}
        <Card className="max-w-full overflow-hidden">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              UPDATE LEADS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6 max-w-full overflow-hidden">

            {/* Lead Contact Card + Lead Tracker */}
            <LeadUpdateForm
              leadId={selectedLeadId}
              allLeads={allLeads}
            />

            {/* ================= TABLE CARD ================= */}
            <Card className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  List of Leads &gt;&gt; [All Leads ({filteredLeads.length} Records)]
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 max-w-full overflow-hidden">

                {/* ✅ ONLY THIS DIV SCROLLS HORIZONTALLY */}
                <div className="w-full overflow-x-auto">
                  <div className="max-h-[450px] overflow-y-auto">

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
                            <TableCell>
                              {(currentPage - 1) * LEADS_PER_PAGE + index + 1}
                            </TableCell>
                            <TableCell>{lead.leadId}</TableCell>
                            <TableCell>
                              {format(new Date(lead.creationDate), 'PPP')}
                            </TableCell>
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
                </div>

                {/* PAGINATION */}
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

                    <span className="self-center text-sm">
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
            {/* ================= END TABLE ================= */}

          </CardContent>
        </Card>

      </div>
    </AppContent>
  );
}
