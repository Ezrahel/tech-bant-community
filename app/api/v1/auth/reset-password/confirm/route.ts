import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey } from '@/lib/supabase';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string; otpCode: string; newPassword: string }>(req);
        if (!body?.email || !body?.otpCode || !body?.newPassword) {
            return errorResponse('Email, OTP code, and new password are required');
        }
        if (body.newPassword.length < 8) {
            return errorResponse('Password must be at least 8 characters');
        }

        const supabase = getSupabaseAdmin();

        // Find latest unused OTP
        const { data: otp } = await supabase
            .from('otps')
            .select('*')
            .eq('email', body.email)
            .eq('type', 'password_reset')
            .eq('used', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!otp) return errorResponse('Invalid or expired reset code', 400);

        // Check expiry
        if (new Date(otp.expires_at) < new Date()) {
            await supabase.from('otps').update({ used: true }).eq('id', otp.id);
            return errorResponse('Code expired', 400);
        }

        // Check attempts
        if (otp.attempts >= 5) {
            await supabase.from('otps').update({ used: true }).eq('id', otp.id);
            return errorResponse('Too many attempts, code disabled', 400);
        }

        // Verify code (using SHA256 hash comparison)
        const hashedInput = createHash('sha256').update(body.otpCode).digest('hex');
        if (hashedInput !== otp.code) {
            await supabase
                .from('otps')
                .update({ attempts: (otp.attempts || 0) + 1 })
                .eq('id', otp.id);
            return errorResponse('Invalid code', 400);
        }

        // Mark as used
        await supabase.from('otps').update({ used: true }).eq('id', otp.id);

        // Get user
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', body.email)
            .single();

        if (!user) return errorResponse('User not found', 404);

        // Update password in Supabase Auth
        const supabaseURL = getSupabaseURL();
        const serviceKey = getSupabaseServiceKey();

        const resp = await fetch(`${supabaseURL}/auth/v1/admin/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ password: body.newPassword }),
        });

        if (!resp.ok) return errorResponse('Failed to reset password', 500);

        // Invalidate all sessions
        await supabase
            .from('sessions')
            .update({ is_active: false })
            .eq('user_id', user.id);

        return jsonResponse({ message: 'Password reset successfully' });
    } catch (error: unknown) {
        console.error('Confirm reset error:', error);
        return errorResponse('Internal server error', 500);
    }
}
