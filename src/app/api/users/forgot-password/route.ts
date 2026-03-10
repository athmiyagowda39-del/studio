import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/server-actions/users';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body.email;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log(`[FORGOT_PASSWORD] Request received for: ${email}`);
        const result = await requestPasswordReset(email);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[FORGOT_PASSWORD_API_ERROR]', error);
        return NextResponse.json({ 
            error: error.message || 'A server error occurred during the password reset process' 
        }, { status: 500 });
    }
}
