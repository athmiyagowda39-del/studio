
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
import { firestore as db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';


/* ---------------- MODULES ---------------- */
const hrCoreModules = [
  'Manpower Resource Planning',
  'Recruitment and Requisition Management',
  'Onboarding',
  'Letter Generation',
  'Leave Management',
];

const attendanceSubModules = [
  'Desktop Attendance Marking Only',
  'Integration with Attendance Machine',
  'Mobile Attendance Marking without Location',
  'Geo Fencing',
  'Geo Tracking',
];

const hrExtendedModules = [
  'Shift Roaster Management',
  'Timesheet Management',
  'Performance Management',
  'Training Management',
  'Employee Movement / Transfer',
  'Probation to Confirmation',
  'Employee Database Management',
  'Mobile App',
  'Employee Self Service',
];

const financeModules = ['Payroll', 'Separation', 'Travel and Expense'];

const generalModules = [
  'Broadcast | Survey',
  'Query Management',
  'Asset Tracking',
  'Rewards Recognition',
  'Organogram',
  'Declaration | Reprimands',
  'Ex-Employee Portal',
];

const allHrModules = [...hrCoreModules, 'Attendance Management', ...attendanceSubModules, ...hrExtendedModules];
const allFinanceModules = [...financeModules];
const allGeneralModules = [...generalModules];

const getDisplayModule = (selectedModuleString: string): string => {
  if (!selectedModuleString) return 'N/A';

  const selected = new Set(selectedModuleString.split(', ').filter(Boolean));
  const display = [];

  const hrSet = new Set(allHrModules);
  const financeSet = new Set(allFinanceModules);
  const generalSet = new Set(allGeneralModules);

  let hasAllHr = hrSet.size > 0 && [...hrSet].every(m => selected.has(m));
  let hasAllFinance = financeSet.size > 0 && [...financeSet].every(m => selected.has(m));
  let hasAllGeneral = generalSet.size > 0 && [...generalSet].every(m => selected.has(m));

  if (hasAllHr) {
    display.push('HR Module');
    [...hrSet].forEach(m => selected.delete(m));
  }
  if (hasAllFinance) {
    display.push('Finance Module');
    [...financeSet].forEach(m => selected.delete(m));
  }
  if (hasAllGeneral) {
    display.push('General Module');
    [...generalSet].forEach(m => selected.delete(m));
  }

  // Push remaining individual modules
  display.push(...Array.from(selected));
  
  return display.length > 0 ? display.join(', ') : 'N/A';
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
    if (!isAuthenticated || !user) return;
    
    const leadsCollection = collection(db, 'leads');
    let q = query(leadsCollection);

    if (user.role === 'Executive') {
      q = query(leadsCollection, where('executive', '==', user.username));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ ...doc.data(), leadId: doc.id }) as LeadFormData);
      setAllLeads(leadsData);
    });

    return () => unsubscribe();
  }, [user, isAuthenticated]);

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
                              <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                              <TableCell>{lead.headcount || 'N/A'}</TableCell>
                              <TableCell>{lead.sector || 'N/A'}</TableCell>
                              <TableCell>
                                {getDisplayModule(lead.selectedModule)}
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
