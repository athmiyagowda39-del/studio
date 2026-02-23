import { NextResponse } from 'next/server';
import { updateLead } from '@/lib/server-actions/leads';
import type { LeadFormData } from '@/components/leads/lead-upload-form';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const updates: Partial<LeadFormData> = await req.json();
        const updatedLead = await updateLead(id, updates);
        return NextResponse.json(updatedLead);
    } catch (error: any) {
        console.error(`API Error: Failed to update lead ${params.id}`, error);
        return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
    }
}
