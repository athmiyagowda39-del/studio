import { NextResponse } from 'next/server';
import { getLeads, addLeads } from '@/lib/server-actions/leads';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { revalidatePath } from 'next/cache';

export async function GET() {
    try {
        const leads = await getLeads();
        return NextResponse.json(leads);
    } catch (error) {
        console.error('API Error: Failed to get leads', error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const leads: LeadFormData[] = await req.json();
        const addedLeads = await addLeads(leads);
        revalidatePath('/leads-upload');
        revalidatePath('/leads-update');
        return NextResponse.json(addedLeads, { status: 201 });
    } catch (error: any) {
        console.error('API Error: Failed to add leads', error);
        return NextResponse.json({ error: error.message || 'Failed to add leads' }, { status: 500 });
    }
}
