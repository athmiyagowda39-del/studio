'use server';

import { sql, getConnection } from '@/lib/db';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { revalidatePath } from 'next/cache';
import { addErrorLog } from './audit';

function parseLeads(recordset: any[]): LeadFormData[] {
    return recordset.map(lead => ({
        ...lead,
        creationDate: new Date(lead.creationDate).toISOString(),
        executiveViewDate: lead.executiveViewDate ? new Date(lead.executiveViewDate).toISOString() : undefined,
        followUps: lead.followUps ? JSON.parse(lead.followUps) : [],
        toExecutive: !!lead.toExecutive,
    }));
}


export async function getLeads(): Promise<LeadFormData[]> {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute('usp_GetLeads');
    const leads = parseLeads(result.recordset);
    return leads;
  } catch (error) {
    await addErrorLog('getLeads', error);
    console.error('Failed to fetch leads:', error);
    return [];
  }
}

export async function getNextLeadId(): Promise<string> {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('usp_GetNextLeadId');
        if (result.recordset && result.recordset.length > 0) {
            const maxId = result.recordset[0].maxId;
            const nextId = maxId ? (parseInt(maxId, 10) + 1).toString() : '100000';
            return nextId;
        }
        return '100000';
    } catch (error) {
        await addErrorLog('getNextLeadId', error);
        console.error('Failed to get next lead ID, using random fallback:', error);
        // Safer random fallback that fits in INT
        return Math.floor(100000 + Math.random() * 899999).toString();
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
        const userDetails = leads.length > 0 ? `User: ${leads[0].givenBy}` : 'User unknown';
        await addErrorLog('addLeads', error, userDetails);
        console.error('Failed to bulk insert leads:', error);
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
          .input('monthlyContractValue', sql.NVarChar(50), mergedLead.monthlyContractValue || null)
          .input('annualContractValue', sql.NVarChar(50), mergedLead.annualContractValue || null)
          .execute('usp_UpdateLead');

      revalidatePath('/leads-update');

      if (result.recordset.length > 0) {
          const [updatedLead] = parseLeads(result.recordset);
          return updatedLead;
      } else {
          throw new Error('Lead not found after update.');
      }
  } catch (error) {
      await addErrorLog('updateLead', error, `LeadId: ${id}`);
      console.error(`Failed to update lead ${id}:`, error);
      throw new Error('Failed to update lead due to a database error.');
  }
}
