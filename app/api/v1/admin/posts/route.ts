import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAdmin, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /admin/posts - List all posts (admin view)
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const { limit, offset } = paginationParams(req);
        const supabase = getSupabaseAdmin();

        const { data: posts, error } = await supabase
            .from('posts')
            .select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return errorResponse('Failed to fetch posts', 500);
        return jsonResponse(posts || []);
    } catch (error: unknown) {
        console.error('Admin posts error:', error);
        return errorResponse('Internal server error', 500);
    }
}
