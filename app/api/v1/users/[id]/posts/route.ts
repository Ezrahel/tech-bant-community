import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/[id]/posts
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { limit, offset } = paginationParams(req);
        const supabase = getSupabaseAdmin();

        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('author_id', id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return errorResponse('Failed to fetch posts', 500);
        return jsonResponse(posts || []);
    } catch (error: unknown) {
        console.error('Get user posts error:', error);
        return errorResponse('Internal server error', 500);
    }
}
