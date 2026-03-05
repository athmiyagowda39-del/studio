import { NextResponse } from 'next/server';
import { updateLead, deleteLead } from '@/lib/server-actions/leads';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { revalidatePath } from 'next/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const updates: Partial<LeadFormData> = await req.json();
        const updatedLead = await updateLead(id, updates);
        revalidatePath('/leads-update');
        return NextResponse.json(updatedLead);
    } catch (error: any) {
        console.error(`API Error: Failed to update lead`, error);
        return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteLead(id);
        revalidatePath('/leads-update');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(`API Error: Failed to delete lead`, error);
        return NextResponse.json({ error: error.message || 'Failed to delete lead' }, { status: 500 });
    }
}
