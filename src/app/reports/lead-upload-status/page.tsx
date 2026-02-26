'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useEffect, useMemo } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { getDisplayModule } from '@/lib/modules';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Helper component for expandable "box" view
function ExpandableCell({ content, title }: { content: string | null | undefined, title: string }) {
  if (!content || content === 'N/A') return <span className="text-muted-foreground">N/A</span>;
  
  const isShort = content.length < 35;

  if (isShort) {
    return <span>{content}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="flex items-center gap-2 cursor-pointer group transition-colors hover:text-primary max-w-[200px]"
        >
          <span className="flex-1 truncate">{content}</span>
          <span className="shrink-0 text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-sm opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            VIEW
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 shadow-2xl border-2 z-50 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase text-primary border-b pb-1 tracking-wider">{title}</h4>
          <div className="text-sm whitespace-normal break-words leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {content}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function LeadUploadStatusReportPage() {
  const { user, isAuthenticated, isLoading, leads: allLeads, modules } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const visibleLeads = useMemo(() => {
    if (!user || !allLeads) return [];
    if (user.role === 'Executive') {
      return allLeads.filter(lead => lead.executive === user.username);
    }
    return allLeads;
  }, [allLeads, user]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              Lead Upload Status Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto rounded-md border">
                  <Table className="min-w-[1800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Pincode</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact person</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Contact Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Given By</TableHead>
                        <TableHead>Company headcount</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Modules</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleLeads.length > 0 ? (
                        visibleLeads.map((lead, index) => {
                          return (
                            <TableRow key={`${lead.leadId}-${index}`}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{lead.pincode || 'N/A'}</TableCell>
                              <TableCell>{lead.company || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.contactPerson || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <ExpandableCell 
                                  content={lead.address} 
                                  title="Address" 
                                />
                              </TableCell>
                              <TableCell>{lead.state || 'N/A'}</TableCell>
                              <TableCell>{lead.district || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.contactNumber || 'N/A'}
                              </TableCell>
                              <TableCell>{lead.email || 'N/A'}</TableCell>
                              <TableCell>{lead.reference || 'N/A'}</TableCell>
                              <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                              <TableCell>{lead.headcount || 'N/A'}</TableCell>
                              <TableCell>{lead.sector || 'N/A'}</TableCell>
                              <TableCell>
                                <ExpandableCell 
                                  content={getDisplayModule(lead.selectedModule, modules)} 
                                  title="Selected Modules" 
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={14}
                            className="h-24 text-center"
                          >
                            No uploaded leads found.
                          </TableCell>
                        </TableRow>
                      )}
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
