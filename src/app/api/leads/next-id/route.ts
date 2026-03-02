import { NextResponse } from 'next/server';
import { getNextLeadId } from '@/lib/server-actions/leads';

export async function GET() {
    try {
        const nextId = await getNextLeadId();
        return NextResponse.json({ nextId });
    } catch (error: any) {
        console.error('API Error: Failed to get next lead ID', error);
        return NextResponse.json({ error: 'Failed to fetch next lead ID from database' }, { status: 500 });
    }
}