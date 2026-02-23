import { NextResponse } from 'next/server';
import { getUsers, addUser } from '@/lib/server-actions/users';
import type { AppUser } from '@/context/app-context';

export async function GET() {
    try {
        const users = await getUsers();
        return NextResponse.json(users);
    } catch (error) {
        console.error('API Error: Failed to get users', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userData: Omit<AppUser, 'id' | 'password' | 'forcePasswordChange'> = await req.json();
        const newUser = await addUser(userData);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        console.error('API Error: Failed to add user', error);
        return NextResponse.json({ error: error.message || 'Failed to add user' }, { status: 500 });
    }
}
