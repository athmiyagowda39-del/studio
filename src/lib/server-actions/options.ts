import { getConnection } from '@/lib/db';
import { addErrorLog } from './audit';

async function fetchOptions(tableName: string): Promise<string[]> {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`SELECT name FROM ${tableName} ORDER BY name`);
        const options = result.recordset.map(record => record.name);
        return options;
    } catch (error) {
        await addErrorLog(`fetchOptions: ${tableName}`, error);
        console.error(`Failed to fetch options from ${tableName}:`, error);
        throw error;
    }
}

export async function getLeadStatuses(): Promise<string[]> {
    return fetchOptions('LeadStatuses');
}

export async function getLeadSubStatuses(): Promise<string[]> {
    return fetchOptions('LeadSubStatuses');
}

export async function getLeadReferences(): Promise<string[]> {
    return fetchOptions('LeadReferences');
}

export async function getSectors(): Promise<string[]> {
    return fetchOptions('Sectors');
}
