import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /comments/[id]/like - Toggle comment like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: commentId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .single();

        const isLiking = !existingLike;
        const now = new Date().toISOString();

        if (isLiking) {
            await supabase.from('likes').insert({
                comment_id: commentId,
                user_id: user.id,
                created_at: now,
            });
        } else {
            await supabase.from('likes').delete().eq('id', existingLike.id);
        }

        const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', commentId);

        return jsonResponse({
            message: isLiking ? 'Comment liked' : 'Comment unliked',
            liked: isLiking,
            likes: count || 0,
        });
    } catch (error: unknown) {
        console.error('Like comment error:', error);
        return errorResponse('Internal server error', 500);
    }
}
