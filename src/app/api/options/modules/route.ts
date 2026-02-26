import { NextResponse } from 'next/server';
import { getModules } from '@/lib/server-actions/options';

export async function GET() {
    try {
        const modules = await getModules();
        return NextResponse.json(modules);
    } catch (error) {
        console.error('API Error: Failed to get modules', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}
