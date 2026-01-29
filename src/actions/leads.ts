'use server';

import { sql, getConnection } from '@/lib/db';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { revalidatePath } from 'next/cache';

function parseLeads(recordset: any[]): LeadFormData[] {
    return recordset.map(lead => ({
        ...lead,
        followUps: lead.followUps ? JSON.parse(lead.followUps) : [],
        // Make sure boolean values are correct
        toExecutive: !!lead.toExecutive, 
    }));
}

export async function getLeads(): Promise<LeadFormData[]> {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Leads');
    return parseLeads(result.recordset);
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return [];
  }
}

export async function getNextLeadId(): Promise<string> {
    try {
        const pool = await getConnection();
        // Ensure leadId is treated as a number for MAX()
        const result = await pool.request().query("SELECT MAX(CAST(leadId as INT)) as maxId FROM Leads");
        const maxId = result.recordset[0].maxId;
        return maxId ? (maxId + 1).toString() : '100000';
    } catch (error) {
        console.error('Failed to get next lead ID:', error);
        // Fallback in case of error
        return Date.now().toString();
    }
}

export async function addLeads(leads: LeadFormData[]): Promise<LeadFormData[]> {
    if (leads.length === 0) return [];
    
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        
        const table = new sql.Table('Leads');
        table.create = false; // We assume the table already exists
        // Define columns
        table.columns.add('leadId', sql.NVarChar(50), { nullable: false, primary: true });
        table.columns.add('pincode', sql.NVarChar(10), { nullable: true });
        table.columns.add('state', sql.NVarChar(100), { nullable: true });
        table.columns.add('district', sql.NVarChar(100), { nullable: true });
        table.columns.add('address', sql.NVarChar(sql.MAX), { nullable: true });
        table.columns.add('contactPerson', sql.NVarChar(255), { nullable: true });
        table.columns.add('contactNumber', sql.NVarChar(50), { nullable: true });
        table.columns.add('reference', sql.NVarChar(100), { nullable: true });
        table.columns.add('email', sql.NVarChar(255), { nullable: true });
        table.columns.add('company', sql.NVarChar(255), { nullable: true });
        table.columns.add('headcount', sql.NVarChar(50), { nullable: true });
        table.columns.add('sector', sql.NVarChar(100), { nullable: true });
        table.columns.add('selectedModule', sql.NVarChar(sql.MAX), { nullable: true });
        table.columns.add('creationDate', sql.BigInt, { nullable: false });
        table.columns.add('executiveViewDate', sql.BigInt, { nullable: true });
        table.columns.add('followUps', sql.NVarChar(sql.MAX), { nullable: true });
        table.columns.add('nextFollowUpDate', sql.NVarChar(255), { nullable: true });
        table.columns.add('dealer', sql.NVarChar(255), { nullable: true });
        table.columns.add('manager', sql.NVarChar(255), { nullable: true });
        table.columns.add('executive', sql.NVarChar(255), { nullable: true });
        table.columns.add('givenBy', sql.NVarChar(255), { nullable: true });
        table.columns.add('status', sql.NVarChar(100), { nullable: true });
        table.columns.add('leadSubStatus', sql.NVarChar(100), { nullable: true });
        table.columns.add('initialRemarks', sql.NVarChar(sql.MAX), { nullable: true });

        // Add rows
        for (const lead of leads) {
            table.rows.add(
                lead.leadId,
                lead.pincode,
                lead.state,
                lead.district,
                lead.address,
                lead.contactPerson,
                lead.contactNumber,
                lead.reference,
                lead.email,
                lead.company,
                lead.headcount,
                lead.sector,
                lead.selectedModule,
                lead.creationDate,
                lead.executiveViewDate || null,
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

        const request = new sql.Request(transaction);
        await request.bulk(table);
        await transaction.commit();

        revalidatePath('/leads-upload');
        revalidatePath('/leads-update');
        return leads;
    } catch (error) {
        await transaction.rollback();
        console.error('Failed to bulk insert leads:', error);
        throw new Error('Failed to add leads due to a database error.');
    }
}

export async function updateLead(id: string, updates: Partial<LeadFormData>): Promise<LeadFormData> {
  const setClauses: string[] = [];
  const request = (await getConnection()).request().input('id', sql.NVarChar, id);

  for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key) && key !== 'leadId') {
          const value = (updates as any)[key];
          setClauses.push(`${key} = @${key}`);

          if (key === 'followUps') {
              request.input(key, sql.NVarChar(sql.MAX), value ? JSON.stringify(value) : null);
          } else if (typeof value === 'number') {
             request.input(key, sql.BigInt, value);
          } else if (typeof value === 'boolean') {
              request.input(key, sql.Bit, value);
          } else {
              request.input(key, sql.NVarChar, value === null ? null : String(value));
          }
      }
  }

  if (setClauses.length === 0) {
    throw new Error('No updates provided for lead.');
  }

  const queryString = `UPDATE Leads SET ${setClauses.join(', ')} OUTPUT inserted.* WHERE leadId = @id`;

  try {
      const result = await request.query(queryString);
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