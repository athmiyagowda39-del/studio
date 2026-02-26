import { NextResponse } from 'next/server';
import { getSectors } from '@/lib/server-actions/options';

export async function GET() {
    try {
        const sectors = await getSectors();
        return NextResponse.json(sectors);
    } catch (error) {
        console.error('API Error: Failed to get sectors', error);
        return NextResponse.json({ error: 'Failed to fetch sectors' }, { status: 500 });
    }
}
