
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
