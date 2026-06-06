import { NextRequest } from 'next/server';
import { clearAuthCookies, jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { syncUserPostsCountWithSupabase } from '@/lib/user-stats';

export async function GET(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) {
            return authResult.status === 401
                ? clearAuthCookies(authResult)
                : authResult;
        }
        const { user: authUser } = authResult;

        const supabase = getSupabaseAdmin();
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !user) return errorResponse('User not found', 404);

        try {
            user.posts_count = await syncUserPostsCountWithSupabase(supabase, authUser.id);
        } catch (syncError) {
            console.error('Verify posts count sync error:', syncError);
        }

        return jsonResponse({ user });
    } catch (error: unknown) {
        console.error('Verify error:', error);
        return errorResponse('Internal server error', 500);
    }
}
