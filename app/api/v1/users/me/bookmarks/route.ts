import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/me/bookmarks
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const { limit, offset } = paginationParams(req);
        const supabase = getSupabaseAdmin();

        // Get bookmarked post IDs
        const { data: bookmarks, error } = await supabase
            .from('bookmarks')
            .select('post_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error || !bookmarks?.length) return jsonResponse([]);

        const postIds = bookmarks.map((b) => b.post_id);

        const { data: posts } = await supabase
            .from('posts')
            .select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)')
            .in('id', postIds);

        return jsonResponse(posts || []);
    } catch (error: unknown) {
        console.error('Get bookmarks error:', error);
        return errorResponse('Internal server error', 500);
    }
}
