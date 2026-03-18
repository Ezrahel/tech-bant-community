import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { issueEmailOTP } from '@/lib/security';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();
        await supabase.from('two_factor_auth').upsert({
            user_id: user.id,
            enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        const { data: profile } = await supabase
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single();

        if (!profile?.email) {
            return errorResponse('User not found', 404);
        }

        await issueEmailOTP(supabase, {
            userID: user.id,
            email: profile.email,
            type: '2fa',
            resendAPIKey: process.env.RESEND_API_KEY,
            resendFrom: process.env.RESEND_FROM || 'noreply@techbantcommunity.com',
            subject: 'Confirm Two-Factor Authentication',
            html: (code) => `<p>Your verification code is: <strong>${code}</strong></p><p>Use this code to enable two-factor authentication. It expires in 10 minutes.</p>`,
        });

        return jsonResponse({ message: 'Verification code sent successfully' });
    } catch (error: unknown) {
        console.error('Enable 2FA error:', error);
        return errorResponse('Internal server error', 500);
    }
}
