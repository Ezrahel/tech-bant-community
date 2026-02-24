import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { randomInt, createHash } from 'crypto';

// POST /auth/2fa/send-otp
export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string }>(req);
        if (!body?.email) return errorResponse('Email is required');

        const supabase = getSupabaseAdmin();

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', body.email)
            .single();

        if (!user) return errorResponse('User not found', 404);

        // Generate OTP
        const code = String(randomInt(100000, 999999));
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const hashedCode = createHash('sha256').update(code).digest('hex');

        await supabase.from('otps').insert({
            user_id: user.id,
            email: body.email,
            code: hashedCode,
            type: '2fa',
            expires_at: expiresAt,
            used: false,
            attempts: 0,
            created_at: now,
        });

        // Send via Resend
        try {
            const resendKey = process.env.RESEND_API_KEY;
            const resendFrom = process.env.RESEND_FROM || 'noreply@techbantcommunity.com';
            if (resendKey) {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendKey}`,
                    },
                    body: JSON.stringify({
                        from: resendFrom,
                        to: body.email,
                        subject: 'Your Login Verification Code',
                        html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
                    }),
                });
            }
        } catch (emailErr) {
            console.error('Email send error:', emailErr);
        }

        return jsonResponse({ message: 'OTP sent successfully' });
    } catch (error: unknown) {
        console.error('Send OTP error:', error);
        return errorResponse('Internal server error', 500);
    }
}
