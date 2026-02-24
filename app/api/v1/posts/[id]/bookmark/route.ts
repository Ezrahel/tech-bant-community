import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /posts/[id]/bookmark - Toggle bookmark
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        const { data: existing } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            await supabase.from('bookmarks').delete().eq('id', existing.id);
            return jsonResponse({ message: 'Post unbookmarked' });
        } else {
            await supabase.from('bookmarks').insert({
                post_id: postId,
                user_id: user.id,
                created_at: new Date().toISOString(),
            });
            return jsonResponse({ message: 'Post bookmarked' });
        }
    } catch (error: unknown) {
        console.error('Bookmark error:', error);
        return errorResponse('Internal server error', 500);
    }
}
