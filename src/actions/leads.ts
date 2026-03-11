'use server';

import { sql, getConnection } from '@/lib/db';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { revalidatePath } from 'next/cache';
import { addErrorLog } from './audit';
import ExcelJS from 'exceljs';

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
    throw error;
  }
}

export async function getNextLeadId(): Promise<string> {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('usp_GetNextLeadId');
        if (result.recordset && result.recordset.length > 0) {
            const maxId = result.recordset[0].maxId;
            const nextId = maxId ? (BigInt(maxId) + BigInt(1)).toString() : '100000';
            return nextId;
        }
        return '100000';
    } catch (error) {
        await addErrorLog('getNextLeadId', error);
        console.error('Failed to get next lead ID:', error);
        throw error;
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
    table.columns.add('monthlyContractValue', sql.NVarChar(50));
    table.columns.add('annualContractValue', sql.NVarChar(50));

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
            lead.initialRemarks || null,
            lead.monthlyContractValue || null,
            lead.annualContractValue || null
        );
    }
    
    try {
        const request = pool.request();
        request.input('leads', table);
        await request.execute('usp_BulkAddLeads');

        revalidatePath('/leads-upload');
        revalidatePath('/leads-update');
        revalidatePath('/dashboard');
        return leads;
    } catch (error: any) {
        const userDetails = leads.length > 0 ? `User: ${leads[0].givenBy}` : 'User unknown';
        await addErrorLog('addLeads', error, userDetails);
        console.error('Failed to bulk insert leads:', error);
        throw new Error('Failed to add leads due to a database error: ' + error.message);
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
      revalidatePath('/dashboard');

      if (result.recordset.length > 0) {
          const [updatedLead] = parseLeads(result.recordset);
          return updatedLead;
      } else {
          throw new Error('Lead not found after update.');
      }
  } catch (error: any) {
      await addErrorLog('updateLead', error, `LeadId: ${id}`);
      console.error(`Failed to update lead ${id}:`, error);
      throw new Error('Failed to update lead due to a database error.');
  }
}

export async function deleteLead(id: string): Promise<{ success: boolean }> {
  try {
    const pool = await getConnection();
    
    // Use direct SQL deletion as a reliable fallback if SP is missing
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Leads WHERE leadId = @id');
    
    revalidatePath('/leads-update');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    await addErrorLog('deleteLead', error, `LeadId: ${id}`);
    throw new Error(error.message || 'Failed to delete lead from database.');
  }
}

export async function generateLeadSampleExcel() {
  try {
    const pool = await getConnection();
    
    // Fetch data for dropdowns
    const [sectorsRes, referencesRes, usersRes, modulesRes] = await Promise.all([
      pool.request().query('SELECT name FROM Sectors ORDER BY name'),
      pool.request().query('SELECT name FROM LeadReferences ORDER BY name'),
      pool.request().query('SELECT username, role FROM Users ORDER BY username'),
      pool.request().query('SELECT name, category FROM Modules ORDER BY category, name')
    ]);

    const sectors = sectorsRes.recordset.map(r => r.name);
    const references = referencesRes.recordset.map(r => r.name);
    const managers = usersRes.recordset.filter(u => u.role === 'Manager').map(u => u.username);
    const executives = usersRes.recordset.filter(u => u.role === 'Executive').map(u => u.username);
    const dbModules = modulesRes.recordset;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    const headers = [
      'company', 'contactPerson', 'address', 'state', 'district', 'contactNumber', 'email', 'pincode', 'reference', 'headcount', 'sector', 'module list', 'manager', 'executive'
    ];
    worksheet.addRow(headers);

    // Lists sheet for validation
    const listSheet = workbook.addWorksheet('Lists');
    // listSheet.state = 'hidden';

    // Populate lists
    sectors.forEach((v, i) => listSheet.getCell(`A${i + 1}`).value = v);
    references.forEach((v, i) => listSheet.getCell(`B${i + 1}`).value = v);
    managers.forEach((v, i) => listSheet.getCell(`C${i + 1}`).value = v);
    executives.forEach((v, i) => listSheet.getCell(`E${i + 1}`).value = v);

    // Dynamic Module list based on categories
    const moduleItems: string[] = ['Module Category', 'All Modules'];
    const categories = Array.from(new Set(dbModules.map((m: any) => m.category)));
    
    categories.forEach(cat => {
      moduleItems.push(`${cat} Modules`);
      const catModules = dbModules.filter((m: any) => m.category === cat);
      catModules.forEach((m: any) => {
        moduleItems.push(`  ${m.name}`);
      });
    });

    moduleItems.forEach((v, i) => {
      const cell = listSheet.getCell(`D${i + 1}`);
      cell.value = v;
      if (v === 'Module Category' || v.endsWith(' Modules')) {
        cell.font = { bold: true };
      }
    });

    const sectorRange = `Lists!$A$1:$A$${Math.max(sectors.length, 1)}`;
    const referenceRange = `Lists!$B$1:$B$${Math.max(references.length, 1)}`;
    const managerRange = `Lists!$C$1:$C$${Math.max(managers.length, 1)}`;
    const moduleRange = `Lists!$D$1:$D$${moduleItems.length}`;
    const executiveRange = `Lists!$E$1:$E$${Math.max(executives.length, 1)}`;

    // Apply data validation to first 1000 rows
    for (let i = 2; i <= 1001; i++) {
      worksheet.getCell(`I${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [referenceRange] };
      worksheet.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [sectorRange] };
      worksheet.getCell(`L${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [moduleRange] };
      worksheet.getCell(`M${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [managerRange] };
      worksheet.getCell(`N${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [executiveRange] };
    }

    // Add helper notes for columns
    const addNote = (cellRef: string, text: string) => {
      const cell = worksheet.getCell(cellRef);
      cell.note = text;
    };

    addNote('L1', 'For multiple module to be added use comma and add it');

    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(col => col.width = 22);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error: any) {
    console.error('Excel Generation Error:', error);
    throw new Error('Failed to generate Excel file: ' + error.message);
  }
}
