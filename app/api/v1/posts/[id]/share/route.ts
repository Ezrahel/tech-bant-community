import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /posts/[id]/share - Track post share
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const supabase = getSupabaseAdmin();

        // Check if post exists
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('shares')
            .eq('id', postId)
            .single();

        if (fetchError || !post) return errorResponse('Post not found', 404);

        // Increment shares count
        const newCount = (post.shares || 0) + 1;
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                shares: newCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (updateError) return errorResponse('Failed to update share count', 500);

        return jsonResponse({ message: 'Share tracked successfully', shares: newCount });
    } catch (error: unknown) {
        console.error('Share post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
