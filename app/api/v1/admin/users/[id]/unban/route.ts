import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /admin/users/[id]/unban - Unban a user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('users')
            .update({
                is_active: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', targetId);

        if (error) return errorResponse('Failed to unban user', 500);

        // Clear any account lockout
        await supabase.from('account_lockouts').delete().eq('user_id', targetId);

        // Log security event
        await supabase.from('security_events').insert({
            user_id: targetId,
            event_type: 'user_unbanned',
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            success: true,
            details: `Unbanned by admin ${user.id}`,
            created_at: new Date().toISOString(),
        });

        return jsonResponse({ message: 'User unbanned successfully' });
    } catch (error: unknown) {
        console.error('Unban user error:', error);
        return errorResponse('Internal server error', 500);
    }
}
