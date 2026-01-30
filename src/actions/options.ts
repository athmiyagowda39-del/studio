
'use server';

import { getConnection } from '@/lib/db';

async function fetchOptions(tableName: string): Promise<string[]> {
    console.log(`Attempting to fetch options from table: ${tableName}`);
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`SELECT name FROM ${tableName} ORDER BY name`);
        const options = result.recordset.map(record => record.name);
        console.log(`Successfully fetched ${options.length} options from ${tableName}.`);
        return options;
    } catch (error) {
        console.error(`Failed to fetch options from ${tableName}:`, error);
        return [];
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
