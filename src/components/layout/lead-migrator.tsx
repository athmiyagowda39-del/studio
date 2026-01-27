
'use client';

import { useEffect, useState } from 'react';
import { firestore as db } from '@/lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { LeadFormData } from '../leads/lead-upload-form';

const MIGRATION_KEY = 'firestoreLeadsMigrated';

export default function LeadMigrator() {
  const [migrationAttempted, setMigrationAttempted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (migrationAttempted) return;
    
    const runMigration = async () => {
      setMigrationAttempted(true);

      const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
      if (alreadyMigrated) {
        return;
      }

      const localLeadsJson = localStorage.getItem('allLeads');
      if (!localLeadsJson) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }
      
      const localLeads: LeadFormData[] = JSON.parse(localLeadsJson);
      if (localLeads.length === 0) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }

      try {
        const leadsCollection = collection(db, 'leads');
        const firestoreSnapshot = await getDocs(leadsCollection);

        if (firestoreSnapshot.empty) {
          console.log(`Migrating ${localLeads.length} leads from localStorage to Firestore...`);
          toast({
            title: "Migrating Local Data",
            description: `Moving ${localLeads.length} leads to Firestore. This may take a moment.`,
          });
          
          const batch = writeBatch(db);
          localLeads.forEach(lead => {
            const leadDocRef = doc(collection(db, 'leads'));
            const leadWithId = { ...lead, leadId: leadDocRef.id };
            batch.set(leadDocRef, leadWithId);
          });
          await batch.commit();

          localStorage.removeItem('allLeads');
          localStorage.setItem(MIGRATION_KEY, 'true');
          console.log("Lead migration complete.");
          toast({
            title: "Migration Successful",
            description: "Your local lead data has been moved to the cloud.",
          });
          window.location.reload(); // Reload to fetch new data from Firestore
        } else {
           console.log("Firestore already contains leads. Skipping migration.");
           localStorage.setItem(MIGRATION_KEY, 'true');
           localStorage.removeItem('allLeads');
        }
      } catch (error) {
        console.error("Error migrating leads:", error);
        toast({
          variant: 'destructive',
          title: "Migration Failed",
          description: "Could not migrate local data to Firestore.",
        });
      }
    };

    runMigration();
  }, [migrationAttempted, toast]);

  return null;
}
