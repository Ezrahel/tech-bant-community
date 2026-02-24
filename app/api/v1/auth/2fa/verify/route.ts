import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ code: string; email?: string }>(req);
        if (!body?.code) return errorResponse('Code is required');

        const supabase = getSupabaseAdmin();

        // Find latest unused OTP for 2FA
        const query = supabase
            .from('otps')
            .select('*')
            .eq('type', '2fa')
            .eq('used', false)
            .order('created_at', { ascending: false })
            .limit(1);

        if (body.email) {
            query.eq('email', body.email);
        }

        const { data: otp } = await query.single();

        if (!otp) return errorResponse('Invalid or expired code', 400);

        if (new Date(otp.expires_at) < new Date()) {
            await supabase.from('otps').update({ used: true }).eq('id', otp.id);
            return errorResponse('Code expired', 400);
        }

        if (otp.attempts >= 5) {
            await supabase.from('otps').update({ used: true }).eq('id', otp.id);
            return errorResponse('Too many attempts', 400);
        }

        const hashedInput = createHash('sha256').update(body.code).digest('hex');
        if (hashedInput !== otp.code) {
            await supabase
                .from('otps')
                .update({ attempts: (otp.attempts || 0) + 1 })
                .eq('id', otp.id);
            return errorResponse('Invalid code', 400);
        }

        await supabase.from('otps').update({ used: true }).eq('id', otp.id);

        return jsonResponse({ message: 'OTP verified successfully' });
    } catch (error: unknown) {
        console.error('Verify OTP error:', error);
        return errorResponse('Internal server error', 500);
    }
}
