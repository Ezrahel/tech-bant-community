import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, getClientIP, getUserAgent } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();
        const body = await parseBody<{ refreshToken?: string }>(req);

        // Invalidate session
        if (body?.refreshToken) {
            await supabase
                .from('sessions')
                .update({ is_active: false })
                .eq('id', body.refreshToken)
                .eq('user_id', user.id);
        }

        // Log event
        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'logout',
            ip_address: getClientIP(req),
            user_agent: getUserAgent(req),
            success: true,
            created_at: new Date().toISOString(),
        });

        return jsonResponse({ message: 'Logged out successfully' });
    } catch (error: unknown) {
        console.error('Logout error:', error);
        return errorResponse('Internal server error', 500);
    }
}
