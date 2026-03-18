import { NextRequest } from 'next/server';
import { jsonResponse, parseBody, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { issueEmailOTP, normalizeEmail } from '@/lib/security';

// POST /auth/2fa/send-otp
export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string }>(req);
        const supabase = getSupabaseAdmin();
        const authUser = await getUserFromRequest(req);

        let targetUser: { id: string; email: string } | null = null;

        if (authUser) {
            const { data: user } = await supabase
                .from('users')
                .select('id, email')
                .eq('id', authUser.id)
                .single();
            targetUser = user || null;
        } else if (body?.email) {
            const email = normalizeEmail(body.email);
            const { data: user } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', email)
                .single();

            if (user) {
                const { data: twoFA } = await supabase
                    .from('two_factor_auth')
                    .select('enabled')
                    .eq('user_id', user.id)
                    .single();

                if (twoFA?.enabled) {
                    targetUser = user;
                }
            }

            if (user && targetUser) {
                targetUser = user;
            }
        }

        if (targetUser) {
            try {
                await issueEmailOTP(supabase, {
                    userID: targetUser.id,
                    email: targetUser.email,
                    type: '2fa',
                    resendAPIKey: process.env.RESEND_API_KEY,
                    resendFrom: process.env.RESEND_FROM || 'noreply@techbantcommunity.com',
                    subject: 'Your Login Verification Code',
                    html: (code) => `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
                });
            } catch (emailErr) {
                console.error('Email send error:', emailErr);
            }
        }

        return jsonResponse({ message: 'If an eligible account exists, an OTP has been sent' });
    } catch (error: unknown) {
        console.error('Send OTP error:', error);
        return jsonResponse({ message: 'If an eligible account exists, an OTP has been sent' });
    }
}
