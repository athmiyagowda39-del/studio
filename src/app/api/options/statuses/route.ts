import { NextResponse } from 'next/server';
import { getLeadStatuses } from '@/lib/server-actions/options';

export async function GET() {
    try {
        const statuses = await getLeadStatuses();
        return NextResponse.json(statuses);
    } catch (error) {
        console.error('API Error: Failed to get lead statuses', error);
        return NextResponse.json({ error: 'Failed to fetch lead statuses' }, { status: 500 });
    }
}
