import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/server-actions/audit';

export async function POST(req: Request) {
    try {
        const { fromDate, toDate, userId } = await req.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ error: 'fromDate and toDate are required' }, { status: 400 });
        }

        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);

        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        
        if (from > to) {
            return NextResponse.json({ error: 'The "From Date" cannot be after the "To Date".' }, { status: 400 });
        }

        const logs = await getAuditLogs(
            from,
            to,
            userId === 'all' ? undefined : userId
        );
        return NextResponse.json(logs);

    } catch (error) {
        console.error('API Error: getAuditLogs', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
