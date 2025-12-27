
'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';


export default function LeadDetails() {
  const [leads, setLeads] = useState<LeadFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadLeads = useCallback(() => {
    setIsLoading(true);
    try {
      // Clear all leads on load, but keep one if exists for demo
      const storedLeads = localStorage.getItem('uploadedLeads');
      if (storedLeads) {
        const parsedLeads: LeadFormData[] = JSON.parse(storedLeads);
        if (parsedLeads.length > 0) {
            // Keep only the last lead
            const lastLead = parsedLeads.slice(-1);
            setLeads(lastLead);
            localStorage.setItem('uploadedLeads', JSON.stringify(lastLead));
        } else {
            setLeads([]);
        }
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Failed to parse leads from localStorage', error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'uploadedLeads') {
        loadLeads();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLeads]);

  const handleDelete = (leadIdToDelete: string) => {
    const updatedLeads = leads.filter(lead => lead.leadId !== leadIdToDelete);
    setLeads(updatedLeads);
    localStorage.setItem('uploadedLeads', JSON.stringify(updatedLeads));
    toast({
      title: 'Lead Deleted',
      description: `Lead with ID ${leadIdToDelete} has been removed.`,
    });
  };

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
                    <TableHead>Module</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Emailid</TableHead>
                    <TableHead>Sector</TableHead>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, index) => {
                    const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                    const isValidDate = lead.creationDate && !isNaN(new Date(lead.creationDate).getTime());
                    const nextFollowupDate = lead.nextFollowUpDate && !isNaN(new Date(lead.nextFollowUpDate).getTime())
                      ? format(new Date(lead.nextFollowUpDate), 'PPP')
                      : (lastFollowUp ? lastFollowUp.nextFollowUp : 'N/A');

                    return (
                        <TableRow key={`${lead.leadId}-${index}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{lead.leadId || 'N/A'}</TableCell>
                            <TableCell>{isValidDate ? format(new Date(lead.creationDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell>{lead.selectedModule || 'N/A'}</TableCell>
                            <TableCell>{lead.company || 'N/A'}</TableCell>
                            <TableCell>{lead.contactPerson || 'N/A'}</TableCell>
                            <TableCell>{lead.contactNumber || 'N/A'}</TableCell>
                            <TableCell>{lead.email || 'N/A'}</TableCell>
                            <TableCell>{lead.sector || 'N/A'}</TableCell>
                            <TableCell>{lead.address || 'N/A'}</TableCell>
                            <TableCell>{lead.district || 'N/A'}</TableCell>
                            <TableCell>{lead.district || 'N/A'}</TableCell>
                            <TableCell>{lead.state || 'N/A'}</TableCell>
                            <TableCell>{lead.reference || 'N/A'}</TableCell>
                            <TableCell>{lead.dealer || 'N/A'}</TableCell>
                            <TableCell>{lead.manager || 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.date : 'N/A'}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.enteredBy : 'N/A'}</TableCell>
                            <TableCell>{nextFollowupDate}</TableCell>
                            <TableCell>{lastFollowUp ? lastFollowUp.remarks : 'N/A'}</TableCell>
                            <TableCell>{lead.status || 'N/A'}</TableCell>
                            <TableCell>{/* Lead Sub Status - No data */}</TableCell>
                            <TableCell>{/* Lead Status Remarks - No data */}</TableCell>
                            <TableCell>{lead.givenBy || 'N/A'}</TableCell>
                            <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the lead
                                        and remove its data from our servers.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(lead.leadId)}>
                                        Continue
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
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
