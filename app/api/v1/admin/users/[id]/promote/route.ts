import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withSuperAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /admin/users/[id]/promote - Promote user to admin (Super Admin only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withSuperAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        if (user.id === targetId) return errorResponse('Cannot promote yourself', 400);

        const body = await parseBody<{ role: string }>(req);
        const role = body?.role || 'admin';

        if (!['user', 'admin', 'super_admin'].includes(role)) {
            return errorResponse('Invalid role. Must be user, admin, or super_admin', 400);
        }

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('users')
            .update({
                role,
                is_admin: role === 'admin' || role === 'super_admin',
                updated_at: new Date().toISOString(),
            })
            .eq('id', targetId);

        if (error) return errorResponse('Failed to promote user', 500);

        // Log security event
        await supabase.from('security_events').insert({
            user_id: targetId,
            event_type: 'user_promoted',
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            success: true,
            details: `Promoted to ${role} by super_admin ${user.id}`,
            created_at: new Date().toISOString(),
        });

        return jsonResponse({ message: 'User promoted successfully' });
    } catch (error: unknown) {
        console.error('Promote user error:', error);
        return errorResponse('Internal server error', 500);
    }
}
