
'use server';

import { sql, getConnection } from '@/lib/db';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { revalidatePath } from 'next/cache';

function parseLeads(recordset: any[]): LeadFormData[] {
    return recordset.map(lead => {
        const parseDateAsUTC = (dateInput: any): string | undefined => {
            if (!dateInput) return undefined;
            try {
                let date: Date;
                if (dateInput instanceof Date) {
                    date = dateInput;
                } else {
                    const dateString = String(dateInput).replace(' ', 'T');
                    date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
                }
                
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
                return undefined;
            } catch {
                return undefined;
            }
        };

        const creationDateISO = parseDateAsUTC(lead.creationDate) || new Date(0).toISOString();
        const executiveViewDateISO = parseDateAsUTC(lead.executiveViewDate);

        return {
            ...lead,
            creationDate: creationDateISO,
            executiveViewDate: executiveViewDateISO,
            followUps: lead.followUps ? JSON.parse(lead.followUps) : [],
            toExecutive: !!lead.toExecutive, 
        };
    });
}


export async function getLeads(): Promise<LeadFormData[]> {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute('usp_GetLeads');
    return parseLeads(result.recordset);
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return [];
  }
}

export type LeadFilterData = {
  searchTerm?: string;
  searchCategory?: string;
  fromDate?: string;
  toDate?: string;
  selectedModules?: string;
  selectedExecutive?: string;
  givenBy?: string;
  selectedStatus?: string;
  selectedSubStatus?: string;
  selectedLeadSource?: string;
  considerStatus?: boolean;
  followUpStatus?: string;
  followUpFromDate?: string;
  followUpToDate?: string;
  followUpEnteredBy?: string;
};

export async function getFilteredLeads(filters: LeadFilterData, user: { username: string; role: string; }): Promise<LeadFormData[]> {
    try {
        const pool = await getConnection();
        const request = pool.request();

        request.input('Username', sql.NVarChar, user.username);
        request.input('UserRole', sql.NVarChar, user.role);

        request.input('SearchTerm', sql.NVarChar, filters.searchTerm || null);
        request.input('SearchCategory', sql.NVarChar, filters.searchCategory || null);
        request.input('FromDate', sql.DateTime, filters.fromDate ? new Date(filters.fromDate) : null);
        request.input('ToDate', sql.DateTime, filters.toDate ? new Date(filters.toDate) : null);
        request.input('SelectedModules', sql.NVarChar, filters.selectedModules || null);
        request.input('Executive', sql.NVarChar, filters.selectedExecutive === 'all' ? null : filters.selectedExecutive);
        request.input('GivenBy', sql.NVarChar, filters.givenBy === 'all' ? null : filters.givenBy);
        request.input('Status', sql.NVarChar, filters.selectedStatus === 'all' ? null : filters.selectedStatus);
        request.input('LeadSubStatus', sql.NVarChar, filters.selectedSubStatus === 'all' ? null : filters.selectedSubStatus);
        request.input('LeadSource', sql.NVarChar, filters.selectedLeadSource === 'all' ? null : filters.selectedLeadSource);
        request.input('ConsiderStatus', sql.Bit, filters.considerStatus || false);
        request.input('FollowUpStatus', sql.NVarChar, filters.followUpStatus || null);
        request.input('FollowUpFromDate', sql.DateTime, filters.followUpFromDate ? new Date(filters.followUpFromDate) : null);
        request.input('FollowUpToDate', sql.DateTime, filters.followUpToDate ? new Date(filters.followUpToDate) : null);
        request.input('FollowUpEnteredBy', sql.NVarChar, filters.followUpEnteredBy === 'all' ? null : filters.followUpEnteredBy);

        const result = await request.execute('usp_FilterLeads');
        return parseLeads(result.recordset);
    } catch (error) {
        console.error('Failed to fetch filtered leads:', error);
        return [];
    }
}


export async function getNextLeadId(): Promise<string> {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('usp_GetNextLeadId');
        const maxId = result.recordset[0].maxId;
        return maxId ? (maxId + 1).toString() : '100000';
    } catch (error) {
        console.error('Failed to get next lead ID:', error);
        return Date.now().toString(); // Fallback
    }
}

export async function addLeads(leads: LeadFormData[]): Promise<LeadFormData[]> {
    if (leads.length === 0) return [];
    
    const pool = await getConnection();
    
    const table = new sql.Table('LeadType');
    table.columns.add('leadId', sql.NVarChar(50));
    table.columns.add('pincode', sql.NVarChar(10));
    table.columns.add('state', sql.NVarChar(100));
    table.columns.add('district', sql.NVarChar(100));
    table.columns.add('address', sql.NVarChar(sql.MAX));
    table.columns.add('contactPerson', sql.NVarChar(255));
    table.columns.add('contactNumber', sql.NVarChar(50));
    table.columns.add('reference', sql.NVarChar(100));
    table.columns.add('email', sql.NVarChar(255));
    table.columns.add('company', sql.NVarChar(255));
    table.columns.add('headcount', sql.NVarChar(50));
    table.columns.add('sector', sql.NVarChar(100));
    table.columns.add('selectedModule', sql.NVarChar(sql.MAX));
    table.columns.add('creationDate', sql.DateTime);
    table.columns.add('executiveViewDate', sql.DateTime);
    table.columns.add('followUps', sql.NVarChar(sql.MAX));
    table.columns.add('nextFollowUpDate', sql.NVarChar(255));
    table.columns.add('dealer', sql.NVarChar(255));
    table.columns.add('manager', sql.NVarChar(255));
    table.columns.add('executive', sql.NVarChar(255));
    table.columns.add('givenBy', sql.NVarChar(255));
    table.columns.add('status', sql.NVarChar(100));
    table.columns.add('leadSubStatus', sql.NVarChar(100));
    table.columns.add('initialRemarks', sql.NVarChar(sql.MAX));

    for (const lead of leads) {
        table.rows.add(
            lead.leadId,
            lead.pincode || null,
            lead.state || null,
            lead.district || null,
            lead.address || null,
            lead.contactPerson || null,
            lead.contactNumber || null,
            lead.reference || null,
            lead.email || null,
            lead.company || null,
            lead.headcount || null,
            lead.sector || null,
            lead.selectedModule || null,
            new Date(lead.creationDate),
            lead.executiveViewDate ? new Date(lead.executiveViewDate) : null,
            lead.followUps ? JSON.stringify(lead.followUps) : null,
            lead.nextFollowUpDate || null,
            lead.dealer || null,
            lead.manager || null,
            lead.executive || null,
            lead.givenBy || null,
            lead.status || null,
            lead.leadSubStatus || null,
            lead.initialRemarks || null
        );
    }
    
    try {
        const request = pool.request();
        request.input('leads', table);
        await request.execute('usp_BulkAddLeads');

        revalidatePath('/leads-upload');
        revalidatePath('/leads-update');
        return leads;
    } catch (error) {
        console.error('Failed to bulk insert leads using stored procedure:', error);
        throw new Error('Failed to add leads due to a database error.');
    }
}

export async function updateLead(id: string, updates: Partial<LeadFormData>): Promise<LeadFormData> {
  const pool = await getConnection();

  const leadResult = await pool.request()
      .input('leadId', sql.NVarChar, id)
      .execute('usp_GetLeadById');

  if (leadResult.recordset.length === 0) {
      throw new Error('Lead to update not found.');
  }
  
  const [currentLead] = parseLeads(leadResult.recordset);

  const mergedLead = { ...currentLead, ...updates };

  try {
      const result = await pool.request()
          .input('leadId', sql.NVarChar, mergedLead.leadId)
          .input('pincode', sql.NVarChar(10), mergedLead.pincode || null)
          .input('state', sql.NVarChar(100), mergedLead.state || null)
          .input('district', sql.NVarChar(100), mergedLead.district || null)
          .input('address', sql.NVarChar(sql.MAX), mergedLead.address || null)
          .input('contactPerson', sql.NVarChar(255), mergedLead.contactPerson || null)
          .input('contactNumber', sql.NVarChar(50), mergedLead.contactNumber || null)
          .input('reference', sql.NVarChar(100), mergedLead.reference || null)
          .input('email', sql.NVarChar(255), mergedLead.email || null)
          .input('company', sql.NVarChar(255), mergedLead.company || null)
          .input('headcount', sql.NVarChar(50), mergedLead.headcount || null)
          .input('sector', sql.NVarChar(100), mergedLead.sector || null)
          .input('selectedModule', sql.NVarChar(sql.MAX), mergedLead.selectedModule || null)
          .input('creationDate', sql.DateTime, new Date(mergedLead.creationDate))
          .input('executiveViewDate', sql.DateTime, mergedLead.executiveViewDate ? new Date(mergedLead.executiveViewDate) : null)
          .input('followUps', sql.NVarChar(sql.MAX), mergedLead.followUps ? JSON.stringify(mergedLead.followUps) : null)
          .input('nextFollowUpDate', sql.NVarChar(255), mergedLead.nextFollowUpDate || null)
          .input('dealer', sql.NVarChar(255), mergedLead.dealer || null)
          .input('manager', sql.NVarChar(255), mergedLead.manager || null)
          .input('executive', sql.NVarChar(255), mergedLead.executive || null)
          .input('givenBy', sql.NVarChar(255), mergedLead.givenBy || null)
          .input('status', sql.NVarChar(100), mergedLead.status || null)
          .input('leadSubStatus', sql.NVarChar(100), mergedLead.leadSubStatus || null)
          .input('initialRemarks', sql.NVarChar(sql.MAX), mergedLead.initialRemarks || null)
          .execute('usp_UpdateLead');

      revalidatePath('/leads-update');

      if (result.recordset.length > 0) {
          const [updatedLead] = parseLeads(result.recordset);
          return updatedLead;
      } else {
          throw new Error('Lead not found after update.');
      }
  } catch (error) {
      console.error(`Failed to update lead ${id}:`, error);
      throw new Error('Failed to update lead due to a database error.');
  }
}
