import { NextRequest } from 'next/server';
import { clearAuthCookies, jsonResponse, errorResponse, parseBody, getClientIP, getUserAgent, REFRESH_TOKEN_COOKIE } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await parseBody<{ refreshToken?: string }>(req);
        const now = new Date().toISOString();

        // Invalidate session
        const refreshToken = body?.refreshToken || req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
        if (!refreshToken) {
            return clearAuthCookies(jsonResponse({ message: 'Logged out successfully' }));
        }

        const { data: session } = await supabase
            .from('sessions')
            .select('id, user_id')
            .eq('id', refreshToken)
            .single();

        if (session) {
            await supabase
                .from('sessions')
                .update({ is_active: false })
                .eq('id', refreshToken)
                .eq('user_id', session.user_id);

            // Log event
            await supabase.from('security_events').insert({
                user_id: session.user_id,
                event_type: 'logout',
                ip_address: getClientIP(req),
                user_agent: getUserAgent(req),
                success: true,
                created_at: now,
            });
        }

        return clearAuthCookies(jsonResponse({ message: 'Logged out successfully' }));
    } catch (error: unknown) {
        console.error('Logout error:', error);
        return errorResponse('Internal server error', 500);
    }
}
