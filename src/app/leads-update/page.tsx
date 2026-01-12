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

  // ✅ FILTER TOGGLE STATE
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
      <div className="flex flex-col gap-6 max-w-full">

        {/* PAGE CARD */}
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              UPDATE LEADS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            {/* LEAD STATUS / UPDATE FORM */}
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
                size="sm"
                variant="ghost"
                onClick={() => setShowFilters(prev => !prev)}
              >
                {showFilters ? '▲' : '▼'}
              </Button>
            </div>

            {/* ================= FILTER PANEL ================= */}
            {showFilters && (
              <Card className="border">
                <CardContent className="p-4">
                  {/* ⬇️ PLACE YOUR EXISTING FILTER UI HERE ⬇️ */}
                  {/* (Search, From Date, Product Name, Executive Name, etc.) */}
                  {/* You already have this UI – just move it here */}
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
                {/* ✅ HORIZONTAL SCROLL ONLY FOR TABLE */}
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
                        <TableRow
                          key={lead.leadId}
                          onClick={() => setSelectedLeadId(lead.leadId)}
                          className="cursor-pointer hover:bg-muted"
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

          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
