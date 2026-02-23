import { NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/lib/server-actions/users';
import type { AppUser } from '@/context/app-context';
import { revalidatePath } from 'next/cache';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const updates: Partial<Omit<AppUser, 'id'>> = await req.json();
        const updatedUser = await updateUser(id, updates);
        revalidatePath('/users');
        revalidatePath('/profile');
        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error(`API Error: Failed to update user ${params.id}`, error);
        return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        await deleteUser(id);
        revalidatePath('/users');
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error(`API Error: Failed to delete user ${params.id}`, error);
        return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
    }
}
