import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin, withSuperAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey } from '@/lib/supabase';

// PUT /admin/users/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const body = await parseBody<{ role?: string; is_active?: boolean }>(req);
        if (!body) return errorResponse('Invalid request body');

        const supabase = getSupabaseAdmin();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.role) {
            if (!['user', 'admin', 'super_admin'].includes(body.role)) {
                return errorResponse('Invalid role');
            }
            updates.role = body.role;
            updates.is_admin = body.role === 'admin' || body.role === 'super_admin';
        }

        if (body.is_active !== undefined) {
            updates.is_active = body.is_active;
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', targetId)
            .select('*')
            .single();

        if (error || !user) return errorResponse('Failed to update user', 500);

        return jsonResponse(user);
    } catch (error: unknown) {
        console.error('Admin update user error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /admin/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withSuperAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        if (user.id === targetId) return errorResponse('Cannot delete yourself', 400);

        const supabase = getSupabaseAdmin();
        const supabaseURL = getSupabaseURL();
        const serviceKey = getSupabaseServiceKey();

        // Delete from Supabase Auth
        await fetch(`${supabaseURL}/auth/v1/admin/users/${targetId}`, {
            method: 'DELETE',
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
        });

        // Delete from users table (CASCADE handles related)
        await supabase.from('users').delete().eq('id', targetId);

        return jsonResponse({ message: 'User deleted successfully' });
    } catch (error: unknown) {
        console.error('Admin delete user error:', error);
        return errorResponse('Internal server error', 500);
    }
}
