import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyOTPCode } from '@/lib/security';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ code: string }>(req);
        if (!body?.code) return errorResponse('Code is required');

        const supabase = getSupabaseAdmin();
        const { data: profile } = await supabase
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single();

        if (!profile?.email) {
            return errorResponse('User not found', 404);
        }

        const otpResult = await verifyOTPCode(supabase, {
            userID: user.id,
            email: profile.email,
            type: '2fa',
            code: body.code.trim(),
        });

        if (!otpResult.ok) {
            return errorResponse(otpResult.reason, 400);
        }

        await supabase.from('two_factor_auth').upsert({
            user_id: user.id,
            enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        return jsonResponse({ message: 'OTP verified successfully' });
    } catch (error: unknown) {
        console.error('Verify OTP error:', error);
        return errorResponse('Internal server error', 500);
    }
}
