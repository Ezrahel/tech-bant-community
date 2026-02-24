import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /posts/[id]/like - Toggle like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existingLike) {
            // Unlike
            await supabase.from('likes').delete().eq('id', existingLike.id);
            // Decrement count
            const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
            await supabase.from('posts').update({ likes: Math.max(0, (post?.likes || 0) - 1) }).eq('id', postId);
            return jsonResponse({ message: 'Post unliked' });
        } else {
            // Like
            await supabase.from('likes').insert({
                post_id: postId,
                user_id: user.id,
                created_at: new Date().toISOString(),
            });
            // Increment count
            const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
            await supabase.from('posts').update({ likes: (post?.likes || 0) + 1 }).eq('id', postId);
            return jsonResponse({ message: 'Post liked' });
        }
    } catch (error: unknown) {
        console.error('Like post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
