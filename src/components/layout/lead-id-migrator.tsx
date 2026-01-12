'use client';

import { useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';

export default function LeadIdMigrator() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const leadsJson = localStorage.getItem('allLeads');
        let leads: LeadFormData[] = leadsJson ? JSON.parse(leadsJson) : [];
        
        // Check if migration is needed
        const needsMigration = leads.some(lead => !/^\d{6,}$/.test(lead.leadId));

        if (needsMigration) {
          console.log("Migrating lead IDs...");
          let nextId = 100000;
          const updatedLeads = leads.map(() => {
            const newLeadId = nextId.toString();
            nextId++;
            return { ...leads.find(l => l.leadId), leadId: newLeadId };
          });

          // A bit of a trick to re-map based on original order
          const finalLeads = leads.map((originalLead, index) => ({
            ...originalLead,
            leadId: updatedLeads[index].leadId,
          }));

          localStorage.setItem('allLeads', JSON.stringify(finalLeads));
           console.log("Lead ID migration complete.");
           window.dispatchEvent(new Event('storage')); // Notify other components
        }
      } catch (error) {
        console.error("Error migrating lead IDs:", error);
      }
    }
  }, []);

  return null;
}
