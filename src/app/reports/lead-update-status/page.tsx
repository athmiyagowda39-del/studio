
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
import { useState, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { format } from 'date-fns';
import AppContent from '@/components/layout/app-content';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};

export default function LeadUpdateStatusReportPage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const leads = getLeadsFromLocalStorage();
    let userLeads = leads;
    if(user?.role === 'Executive') {
      userLeads = leads.filter(lead => lead.executive === user.username);
    }
    setAllLeads(userLeads);

     const handleStorageChange = () => {
      let updatedLeads = getLeadsFromLocalStorage();
       if(user?.role === 'Executive') {
        updatedLeads = updatedLeads.filter(lead => lead.executive === user.username);
      }
      setAllLeads(updatedLeads);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              Lead Update Status Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-max">
                    <TableHeader>
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
                        <TableHead>Place</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Last Followed Date</TableHead>
                        <TableHead>Last Followed By</TableHead>
                        <TableHead>Next followup Date</TableHead>
                        <TableHead>Last Followup Remarks</TableHead>
                        <TableHead>Lead Status</TableHead>
                        <TableHead>Lead Sub Status</TableHead>
                        <TableHead>Lead Status Remarks</TableHead>
                        <TableHead>Given By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLeads.length > 0 ? (
                        allLeads.map((lead, index) => {
                          const date = new Date(lead.creationDate);
                          const isValidDate = !isNaN(date.getTime());
                          const lastFollowUp =
                            lead.followUps && lead.followUps.length > 0
                              ? lead.followUps[lead.followUps.length - 1]
                              : null;
                          const nextFollowupDate =
                            lead.nextFollowUpDate &&
                            !isNaN(new Date(lead.nextFollowUpDate).getTime())
                              ? format(new Date(lead.nextFollowUpDate), 'PPP')
                              : lastFollowUp
                              ? lastFollowUp.nextFollowUp
                              : 'N/A';

                          return (
                            <TableRow key={`${lead.leadId}-${index}`}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{lead.leadId || 'N/A'}</TableCell>
                              <TableCell>
                                {isValidDate ? format(date, 'PPP') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {lead.selectedModule || 'N/A'}
                              </TableCell>
                              <TableCell>{lead.company || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.contactPerson || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {lead.contactNumber || 'N/A'}
                              </TableCell>
                              <TableCell>{lead.email || 'N/A'}</TableCell>
                              <TableCell>{lead.address || 'N/A'}</TableCell>
                              <TableCell>{lead.district || 'N/A'}</TableCell>
                              <TableCell>{lead.district || 'N/A'}</TableCell>
                              <TableCell>{lead.state || 'N/A'}</TableCell>
                              <TableCell>{lead.reference || 'N/A'}</TableCell>
                              <TableCell>{lead.manager || 'N/A'}</TableCell>
                              <TableCell>
                                {lastFollowUp ? lastFollowUp.date : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}
                              </TableCell>
                              <TableCell>{nextFollowupDate}</TableCell>
                              <TableCell>
                                {lastFollowUp ? lastFollowUp.remarks : 'N/A'}
                              </TableCell>
                              <TableCell>{lead.status || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.leadSubStatus || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {(lead as any).leadStatusRemarks || 'N/A'}
                              </TableCell>
                              <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={22}
                            className="h-24 text-center"
                          >
                            No leads found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
