import { NextResponse } from 'next/server';
import { getLeadSubStatuses } from '@/lib/server-actions/options';

export async function GET() {
    try {
        const subStatuses = await getLeadSubStatuses();
        return NextResponse.json(subStatuses);
    } catch (error) {
        console.error('API Error: Failed to get lead sub-statuses', error);
        return NextResponse.json({ error: 'Failed to fetch lead sub-statuses' }, { status: 500 });
    }
}
