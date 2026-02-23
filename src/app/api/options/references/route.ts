import { NextResponse } from 'next/server';
import { getLeadReferences } from '@/lib/server-actions/options';

export async function GET() {
    try {
        const references = await getLeadReferences();
        return NextResponse.json(references);
    } catch (error) {
        console.error('API Error: Failed to get lead references', error);
        return NextResponse.json({ error: 'Failed to fetch lead references' }, { status: 500 });
    }
}
