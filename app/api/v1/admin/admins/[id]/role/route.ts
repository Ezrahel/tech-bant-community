import { NextRequest } from 'next/server';
import { errorResponse, jsonResponse, parseBody, withSuperAdmin } from '@/lib/api-helpers';
import { countSuperAdmins, promoteExistingUserToAdmin } from '@/lib/admin-users';
import { getSupabaseAdmin } from '@/lib/supabase';

// PUT /admin/admins/[id]/role
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withSuperAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        if (user.id === targetId) {
            return errorResponse('Cannot change your own role', 400);
        }

        const body = await parseBody<{ role?: string }>(req);
        const role = body?.role;

        if (role !== 'admin' && role !== 'super_admin') {
            return errorResponse('Invalid role', 400);
        }

        const supabase = getSupabaseAdmin();
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', targetId)
            .single();

        if (existingUserError || !existingUser) {
            return errorResponse('Admin not found', 404);
        }

        if (!['admin', 'super_admin'].includes(existingUser.role)) {
            return errorResponse('Target user is not an admin', 400);
        }

        if (existingUser.role === 'super_admin' && role === 'admin') {
            const totalSuperAdmins = await countSuperAdmins();
            if (totalSuperAdmins <= 1) {
                return errorResponse('Cannot demote the last super admin', 400);
            }
        }

        const updatedUser = await promoteExistingUserToAdmin({
            userID: targetId,
            role,
        });

        return jsonResponse(updatedUser);
    } catch (error: unknown) {
        console.error('Admin role update error:', error);
        return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
    }
}
