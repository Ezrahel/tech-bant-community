import { NextRequest } from 'next/server';
import { errorResponse, jsonResponse, withSuperAdmin } from '@/lib/api-helpers';
import { countSuperAdmins } from '@/lib/admin-users';
import { getSupabaseAdmin } from '@/lib/supabase';

// DELETE /admin/admins/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withSuperAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        if (user.id === targetId) return errorResponse('Cannot delete yourself', 400);

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

        if (existingUser.role === 'super_admin') {
            const totalSuperAdmins = await countSuperAdmins();
            if (totalSuperAdmins <= 1) {
                return errorResponse('Cannot delete the last super admin', 400);
            }
        }

        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetId);
        if (authDeleteError) {
            return errorResponse(authDeleteError.message || 'Failed to delete admin auth user', 500);
        }

        const { error: profileDeleteError } = await supabase.from('users').delete().eq('id', targetId);
        if (profileDeleteError) {
            return errorResponse(profileDeleteError.message || 'Failed to delete admin profile', 500);
        }

        return jsonResponse({ message: 'Admin deleted successfully' });
    } catch (error: unknown) {
        console.error('Admin delete error:', error);
        return errorResponse('Internal server error', 500);
    }
}
