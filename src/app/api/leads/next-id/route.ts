import { NextResponse } from 'next/server';
import { getNextLeadId } from '@/lib/server-actions/leads';

export async function GET() {
    try {
        const nextId = await getNextLeadId();
        return NextResponse.json({ nextId });
    } catch (error: any) {
        console.error('API Error: Failed to get next lead ID', error);
        // Provide a fallback on the server side in case of DB error.
        const fallbackId = Date.now().toString();
        return NextResponse.json({ nextId: fallbackId });
    }
}
