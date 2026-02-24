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

        if (existingLike) {
            await supabase.from('likes').delete().eq('id', existingLike.id);
            return jsonResponse({ message: 'Comment unliked' });
        } else {
            await supabase.from('likes').insert({
                comment_id: commentId,
                user_id: user.id,
                created_at: new Date().toISOString(),
            });
            return jsonResponse({ message: 'Comment liked' });
        }
    } catch (error: unknown) {
        console.error('Like comment error:', error);
        return errorResponse('Internal server error', 500);
    }
}
