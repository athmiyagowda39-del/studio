import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/server-actions/users';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        const user = await loginUser(email, password);
        if (user) {
            return NextResponse.json(user);
        } else {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }
    } catch (error: any) {
        console.error('API Error: Login failed', error);
        return NextResponse.json({ error: error.message || 'A server error occurred during login' }, { status: 500 });
    }
}
