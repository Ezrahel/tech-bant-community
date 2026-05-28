import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { queryOptional } from '@/lib/db';

// POST /posts/[id]/like - Toggle like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        const isLiking = !existingLike;
        const now = new Date().toISOString();

        if (isLiking) {
            await supabase.from('likes').insert({
                post_id: postId,
                user_id: user.id,
                created_at: now,
            });
        } else {
            await supabase.from('likes').delete().eq('id', existingLike.id);
        }

        // Atomic counter update via direct SQL
        const delta = isLiking ? 1 : -1;
        const result = await queryOptional<{ likes: number }>(
            `UPDATE public.posts SET likes = GREATEST(0, likes + $1::int), updated_at = $2::timestamptz WHERE id = $3::uuid RETURNING likes`,
            [delta, now, postId]
        );

        let finalLikes: number;
        if (result?.rows[0]?.likes !== undefined) {
            finalLikes = result.rows[0].likes;
        } else {
            // Fallback: use Supabase REST (non-atomic but required if direct DB unavailable)
            const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
            finalLikes = Math.max(0, (post?.likes || 0) + delta);
            await supabase.from('posts').update({
                likes: finalLikes,
                updated_at: now,
            }).eq('id', postId);
        }

        return jsonResponse({
            message: isLiking ? 'Post liked' : 'Post unliked',
            liked: isLiking,
            likes: finalLikes,
        });
    } catch (error: unknown) {
        console.error('Like post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
