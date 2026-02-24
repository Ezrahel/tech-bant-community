import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, getClientIP, getUserAgent } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ currentPassword: string; newPassword: string }>(req);
        if (!body?.newPassword || body.newPassword.length < 8) {
            return errorResponse('New password must be at least 8 characters');
        }

        const supabaseURL = getSupabaseURL();
        const serviceKey = getSupabaseServiceKey();

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
        const supabase = getSupabaseAdmin();
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
