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

export default function LeadDetails() {
  const [leads, setLeads] = useState<LeadFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLeads = localStorage.getItem('uploadedLeads');
      if (storedLeads) {
        setLeads(JSON.parse(storedLeads));
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
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Selected Module</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, index) => (
                    <TableRow key={`${lead.leadId}-${index}`}>
                      <TableCell>{lead.leadId}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>{lead.contactPerson}</TableCell>
                      <TableCell>{lead.contactNumber}</TableCell>
                      <TableCell>{lead.pincode}</TableCell>
                      <TableCell>{lead.state}</TableCell>
                      <TableCell>{lead.district}</TableCell>
                      <TableCell>{lead.address}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.selectedModule}</TableCell>
                    </TableRow>
                  ))}
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
