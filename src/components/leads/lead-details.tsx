'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LeadFormData } from './lead-upload-form';
import { format } from 'date-fns';

export default function LeadDetails() {
  const [leads, setLeads] = useState<LeadFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLeads = localStorage.getItem('uploadedLeads');
      if (storedLeads) {
        const parsedLeads: LeadFormData[] = JSON.parse(storedLeads);
        // This is mock data for status. In a real app this would come from the data
        const leadStatusOptions = [
            'Attended',
            'Not viewed',
            'Demo Given',
            'Unattended',
            'Pursuing to Purchase',
            'Not interested',
            'Order closed',
        ];
        const leadsWithStatus = parsedLeads.map((lead, index) => ({
          ...lead,
          status: lead.status || leadStatusOptions[index % leadStatusOptions.length],
          creationDate: lead.creationDate ? new Date(lead.creationDate).getTime() : new Date().getTime(),
        }));
        setLeads(leadsWithStatus as any);
      }
    } catch (error) {
      console.error('Failed to parse leads from localStorage', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">
            Lead Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <p>Loading lead details...</p>
          ) : leads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sl No</TableHead>
                    <TableHead>Lead Id</TableHead>
                    <TableHead>Lead Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Cell</TableHead>
                    <TableHead>Emailid</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Dealer</TableHead>
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
                  {leads.map((lead, index) => {
                    const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                    const isValidDate = lead.creationDate && !isNaN(new Date(lead.creationDate).getTime());
                    
                    return (
                        <TableRow key={`${lead.leadId}-${index}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{lead.leadId}</TableCell>
                            <TableCell>{isValidDate ? format(new Date(lead.creationDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell>{lead.selectedModule}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                            <TableCell>{lead.contactPerson}</TableCell>
                            <TableCell>{lead.contactNumber}</TableCell>
                            <TableCell>{/* Cell - No data */}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.address}</TableCell>
                            <TableCell>{lead.district}</TableCell>
                            <TableCell>{lead.district}</TableCell>
                            <TableCell>{lead.state}</TableCell>
                            <TableCell>{lead.reference}</TableCell>
                            <TableCell>{lead.dealer || 'N/A'}</TableCell>
                            <TableCell>{lead.manager || 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.date : 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.nextFollowUp : 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.remarks : 'N/A'}</TableCell>
                            <TableCell>{(lead as any).status || 'N/A'}</TableCell>
                            <TableCell>{/* Lead Sub Status - No data */}</TableCell>
                            <TableCell>{/* Lead Status Remarks - No data */}</TableCell>
                            <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No lead details found. Please upload or add leads on the "LEADS
              UPLOAD" page.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
