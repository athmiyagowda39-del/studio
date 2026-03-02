import { NextResponse } from 'next/server';
import { getNextLeadId } from '@/lib/server-actions/leads';

export async function GET() {
    try {
        const nextId = await getNextLeadId();
        return NextResponse.json({ nextId });
    } catch (error: any) {
        console.error('API Error: Failed to get next lead ID', error);
        // Provide a safe random 6-digit fallback on the server side in case of DB error.
        const fallbackId = Math.floor(100000 + Math.random() * 899999).toString();
        return NextResponse.json({ nextId: fallbackId });
    }
}
