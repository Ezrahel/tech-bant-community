import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, getClientIP, getUserAgent } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey, getSupabaseAnonKey } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ currentPassword: string; newPassword: string }>(req);
        if (!body?.currentPassword?.trim()) {
            return errorResponse('Current password is required');
        }
        if (!body?.newPassword || body.newPassword.length < 8) {
            return errorResponse('New password must be at least 8 characters');
        }
        if (body.currentPassword === body.newPassword) {
            return errorResponse('New password must be different from current password');
        }

        const supabase = getSupabaseAdmin();
        const { data: profile } = await supabase
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single();

        if (!profile?.email) {
            return errorResponse('User not found', 404);
        }

        const supabaseURL = getSupabaseURL();
        const anonKey = getSupabaseAnonKey();
        const serviceKey = getSupabaseServiceKey();

        const verifyResp = await fetch(`${supabaseURL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
            },
            body: JSON.stringify({ email: profile.email, password: body.currentPassword }),
        });

        if (!verifyResp.ok) {
            return errorResponse('Current password is incorrect', 401);
        }

        // Update password via Supabase Admin API
        const resp = await fetch(`${supabaseURL}/auth/v1/admin/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ password: body.newPassword }),
        });

        if (!resp.ok) {
            return errorResponse('Failed to update password', 500);
        }

        // Invalidate all sessions
        await supabase
            .from('sessions')
            .update({ is_active: false })
            .eq('user_id', user.id);

        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'password_change',
            ip_address: getClientIP(req),
            user_agent: getUserAgent(req),
            success: true,
            created_at: new Date().toISOString(),
        });

        return jsonResponse({ message: 'Password updated successfully' });
    } catch (error: unknown) {
        console.error('Change password error:', error);
        return errorResponse('Internal server error', 500);
    }
}
