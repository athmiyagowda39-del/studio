
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
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

const getLeadsFromLocalStorage = (): LeadFormData[] => {
  if (typeof window !== 'undefined') {
    const leadsJson = localStorage.getItem('allLeads');
    return leadsJson ? JSON.parse(leadsJson) : [];
  }
  return [];
};

export default function LeadUploadStatusReportPage() {
  const [allLeads, setAllLeads] = useState<LeadFormData[]>([]);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);


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
                        <TableHead>Company headcount</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Modules</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLeads.length > 0 ? (
                        allLeads.map((lead, index) => {
                          return (
                            <TableRow key={`${lead.leadId}-${index}`}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{lead.pincode || 'N/A'}</TableCell>
                              <TableCell>{lead.company || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.contactPerson || 'N/A'}
                              </TableCell>
                              <TableCell>{lead.address || 'NA'}</TableCell>
                              <TableCell>{lead.state || 'N/A'}</TableCell>
                              <TableCell>{lead.district || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.contactNumber || 'N/A'}
                              </TableCell>
                              <TableCell>{lead.email || 'N/A'}</TableCell>
                              <TableCell>{lead.reference || 'N/A'}</TableCell>
                              <TableCell>{lead.headcount || 'N/A'}</TableCell>
                              <TableCell>{lead.sector || 'N/A'}</TableCell>
                              <TableCell>
                                {lead.selectedModule || 'N/A'}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={13}
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
