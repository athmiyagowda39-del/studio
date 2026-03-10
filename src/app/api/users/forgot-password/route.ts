import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/server-actions/users';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        const result = await requestPasswordReset(email);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Error: Forgot password failed', error);
        return NextResponse.json({ error: error.message || 'A server error occurred during the password reset process' }, { status: 500 });
    }
}
