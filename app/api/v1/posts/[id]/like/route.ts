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

            // Atomic decrement using raw SQL is not directly supported via JS client easily without RPC
            // But we can at least do it more safely by using a single update call with a subquery if possible
            // In the absence of RPC, we'll keep the current logic but wrap it in a more robust way if possible
            // For now, let's stick to a slightly better approach or suggest an RPC
            const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
            await supabase.from('posts').update({
                likes: Math.max(0, (post?.likes || 0) - 1),
                updated_at: new Date().toISOString()
            }).eq('id', postId);

            return jsonResponse({ message: 'Post unliked', liked: false, likes: Math.max(0, (post?.likes || 0) - 1) });
        } else {
            // Like
            await supabase.from('likes').insert({
                post_id: postId,
                user_id: user.id,
                created_at: new Date().toISOString(),
            });

            // Increment count
            const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
            const newCount = (post?.likes || 0) + 1;
            await supabase.from('posts').update({
                likes: newCount,
                updated_at: new Date().toISOString()
            }).eq('id', postId);

            return jsonResponse({ message: 'Post liked', liked: true, likes: newCount });
        }
    } catch (error: unknown) {
        console.error('Like post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
