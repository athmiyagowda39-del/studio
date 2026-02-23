import { NextResponse } from 'next/server';
import { addAuditLog, type AuditLogData } from '@/lib/server-actions/audit';

export async function POST(req: Request) {
    try {
        const body: AuditLogData = await req.json();
        await addAuditLog(body);
        return NextResponse.json({ message: 'Log added successfully' }, { status: 201 });
    } catch (error) {
        console.error('API Error: Failed to add audit log', error);
        // We send a success response to the client because audit log failures should not block user actions.
        return NextResponse.json({ message: 'Log addition failed on server, but operation continued.' }, { status: 200 });
    }
}
