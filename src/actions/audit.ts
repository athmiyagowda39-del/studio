'use server';

import { sql, getConnection } from '@/lib/db';

export type AuditLogData = {
    userId?: string;
    username?: string;
    action: string;
    targetEntityType?: string;
    targetEntityId?: string;
    details?: string;
};

export type AuditLogReportEntry = {
    id: number;
    timestamp: string;
    userId: string;
    username: string;
    action: string;
    targetEntityType: string | null;
    targetEntityId: string | null;
    details: string | null;
}

export async function addAuditLog(logData: AuditLogData) {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('userId', sql.NVarChar, logData.userId || null)
            .input('username', sql.NVarChar, logData.username || null)
            .input('action', sql.NVarChar, logData.action)
            .input('targetEntityType', sql.NVarChar, logData.targetEntityType || null)
            .input('targetEntityId', sql.NVarChar, logData.targetEntityId || null)
            .input('details', sql.NVarChar(sql.MAX), logData.details || null)
            .execute('usp_AddAuditLog');
    } catch (error) {
        // We log the error to the console, but don't re-throw.
        // A failure to write to the audit log should not crash the primary application functionality.
        console.error('Failed to write audit log:', error);
    }
}

export async function getAuditLogs(fromDate: Date, toDate: Date, userId?: string): Promise<AuditLogReportEntry[]> {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('fromDate', sql.DateTime, fromDate)
            .input('toDate', sql.DateTime, toDate)
            .input('userId', sql.NVarChar, userId || null)
            .execute('usp_GetAuditLogs');

        return result.recordset.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp).toISOString(),
        }));
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
    }
}
