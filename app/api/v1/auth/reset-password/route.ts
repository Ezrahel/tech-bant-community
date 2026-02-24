import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { randomInt } from 'crypto';

// POST /auth/reset-password - Request password reset (sends OTP)
export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string }>(req);
        if (!body?.email) return errorResponse('Email is required');

        const supabase = getSupabaseAdmin();

        // Get user (don't reveal if exists)
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', body.email)
            .single();

        if (user) {
            // Generate OTP
            const code = String(randomInt(100000, 999999));
            const now = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            // Hash OTP (simple hash for storage)
            const { createHash } = await import('crypto');
            const hashedCode = createHash('sha256').update(code).digest('hex');

            await supabase.from('otps').insert({
                user_id: user.id,
                email: body.email,
                code: hashedCode,
                type: 'password_reset',
                expires_at: expiresAt,
                used: false,
                attempts: 0,
                created_at: now,
            });

            // Send email via Resend
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
                            subject: 'Password Reset Code',
                            html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
                        }),
                    });
                }
            } catch (emailErr) {
                console.error('Email send error:', emailErr);
            }
        }

        // Always return success to prevent email enumeration
        return jsonResponse({ message: 'If an account exists, a reset code has been sent' });
    } catch (error: unknown) {
        console.error('Reset password error:', error);
        return errorResponse('Internal server error', 500);
    }
}
