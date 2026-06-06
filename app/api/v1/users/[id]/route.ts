import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PUBLIC_USER_COLUMNS } from '@/lib/security';
import { syncUserPostsCountWithSupabase } from '@/lib/user-stats';

// GET /users/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
            .from('users')
            .select(PUBLIC_USER_COLUMNS)
            .eq('id', id)
            .single();
        if (error || !user) return errorResponse('User not found', 404);

        try {
            user.posts_count = await syncUserPostsCountWithSupabase(supabase, id);
        } catch (syncError) {
            console.error('Get user posts count sync error:', syncError);
        }

        return jsonResponse(user);
    } catch (error: unknown) {
        console.error('Get user error:', error);
        return errorResponse('Internal server error', 500);
    }
}
