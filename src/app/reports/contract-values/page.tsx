
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
import { useMemo, useEffect } from 'react';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function ContractValuesReportPage() {
  const { user, isAuthenticated, isLoading, leads: allLeads } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const monthlyContractLeads = useMemo(() => {
    return allLeads
      .filter(lead => lead.monthlyContractValue && parseFloat(lead.monthlyContractValue) > 0)
      .sort((a, b) => parseFloat(b.monthlyContractValue!) - parseFloat(a.monthlyContractValue!));
  }, [allLeads]);

  const annualContractLeads = useMemo(() => {
    return allLeads
      .filter(lead => lead.annualContractValue && parseFloat(lead.annualContractValue) > 0)
      .sort((a, b) => parseFloat(b.annualContractValue!) - parseFloat(a.annualContractValue!));
  }, [allLeads]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-center text-primary">
              Contract Values Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Monthly Contract Values Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Contract Values ({monthlyContractLeads.length})</CardTitle>
                <p className="text-sm text-muted-foreground">This table shows all leads with a recorded monthly contract value.</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Lead Id</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead className="text-right">Monthly Value (INR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyContractLeads.length > 0 ? (
                        monthlyContractLeads.map((lead, index) => (
                          <TableRow key={lead.leadId}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{lead.leadId}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                            <TableCell>{lead.executive || 'N/A'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(lead.monthlyContractValue!))}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No leads with monthly contract values found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Annual Contract Values Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Annual Contract Values ({annualContractLeads.length})</CardTitle>
                 <p className="text-sm text-muted-foreground">This table shows all leads with a recorded annual contract value.</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sl No</TableHead>
                        <TableHead>Lead Id</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead className="text-right">Annual Value (INR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {annualContractLeads.length > 0 ? (
                        annualContractLeads.map((lead, index) => (
                          <TableRow key={lead.leadId}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{lead.leadId}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                            <TableCell>{lead.executive || 'N/A'}</TableCell>
                            <TableCell className="text-right font-medium">
                               {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(lead.annualContractValue!))}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No leads with annual contract values found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </AppContent>
  );
}
