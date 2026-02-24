import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getClientIP, getUserAgent } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ refreshToken: string }>(req);
        if (!body?.refreshToken) return errorResponse('Refresh token is required');

        const supabase = getSupabaseAdmin();
        const ipAddress = getClientIP(req);
        const userAgent = getUserAgent(req);

        // Get session
        const { data: session, error } = await supabase
            .from('sessions')
            .select('user_id, token_id, expires_at')
            .eq('id', body.refreshToken)
            .eq('is_active', true)
            .single();

        if (error || !session) return errorResponse('Invalid or expired refresh token', 401);

        if (new Date(session.expires_at) < new Date()) {
            return errorResponse('Refresh token expired', 401);
        }

        // Get user
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user_id)
            .single();

        if (!user) return errorResponse('User not found', 404);

        // Create new session
        const now = new Date().toISOString();
        const sessionID = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('sessions').insert({
            id: sessionID,
            user_id: user.id,
            token_id: session.token_id,
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: now,
            expires_at: expiresAt,
            last_activity: now,
            is_active: true,
        });

        // Invalidate old session
        await supabase
            .from('sessions')
            .update({ is_active: false })
            .eq('id', body.refreshToken);

        const permissions = getRolePermissions(user.role);

        return jsonResponse({
            token: session.token_id,
            refreshToken: sessionID,
            expiresIn: 86400,
            user,
            roles: [user.role],
            permissions,
        });
    } catch (error: unknown) {
        console.error('Refresh error:', error);
        return errorResponse('Internal server error', 500);
    }
}

function getRolePermissions(role: string): string[] {
    switch (role) {
        case 'super_admin':
            return ['read', 'write', 'delete', 'admin', 'manage_admins', 'manage_roles', 'view_analytics'];
        case 'admin':
            return ['read', 'write', 'delete', 'admin', 'view_analytics'];
        default:
            return ['read', 'write'];
    }
}
